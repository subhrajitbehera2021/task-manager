require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("Public"));

/* ================= SUPABASE ================= */

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey || !process.env.JWT_SECRET) {
    console.error("Missing environment variables");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase Connected");

/* ================= AUTH MIDDLEWARE ================= */

const auth = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

/* ================= AUTH ROUTES ================= */

// SIGNUP
app.post("/api/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const { error } = await supabase
            .from("users")
            .insert([
                {
                    name,
                    email,
                    password: hashedPassword
                }
            ]);

        if (error) {
            console.log("Signup error:", error);
            return res.status(500).json({
                message: "Signup failed"
            });
        }

        res.json({
            message: "User registered successfully"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Signup error"
        });
    }
});

// LOGIN
app.post("/api/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .maybeSingle();

        if (error || !user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Wrong password"
            });
        }

        const token = jwt.sign(
            { id: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ token });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Login error"
        });
    }
});

/* ================= TASK ROUTES ================= */

// ADD TASK
app.post("/api/tasks", auth, async (req, res) => {
    try {
        const { name, status, deadline } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Task name is required"
            });
        }

        const { data, error } = await supabase
            .from("tasks")
            .insert([
                {
                    name,
                    status: status || "pending",
                    deadline: deadline || null,
                    user_id: req.userId
                }
            ])
            .select();

        if (error) {
            console.log("Add task error:", error);
            return res.status(500).json({
                message: "Error adding task"
            });
        }

        res.json(data[0]);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// GET TASKS
app.get("/api/tasks", auth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", req.userId)
            .order("id", { ascending: false });

        if (error) {
            console.log("Get tasks error:", error);
            return res.status(500).json({
                message: "Error fetching tasks"
            });
        }

        res.json(data);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// UPDATE TASK
app.put("/api/tasks/:id", auth, async (req, res) => {
    try {
        const { name, status, deadline } = req.body;

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (status !== undefined) updateData.status = status;
        if (deadline !== undefined) updateData.deadline = deadline || null;

        const { data, error } = await supabase
            .from("tasks")
            .update(updateData)
            .eq("id", req.params.id)
            .eq("user_id", req.userId)
            .select();

        if (error) {
            console.log("Update task error:", error);
            return res.status(500).json({
                message: "Error updating task"
            });
        }

        if (!data.length) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        res.json(data[0]);

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

// DELETE TASK
app.delete("/api/tasks/:id", auth, async (req, res) => {
    try {
        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", req.params.id)
            .eq("user_id", req.userId);

        if (error) {
            console.log("Delete task error:", error);
            return res.status(500).json({
                message: "Error deleting task"
            });
        }

        res.json({
            message: "Task deleted"
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Server error"
        });
    }
});

/* ================= SMART API RECOMMENDATION ================= */

app.get("/api/recommendations", auth, async (req, res) => {
    try {
        const { data: tasks, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", req.userId)
            .eq("status", "completed");

        if (error) {
            console.log("Recommendation error:", error);
            return res.status(500).json({
                message: "Error fetching recommendations"
            });
        }

        const categories = {
            coding: 0,
            study: 0,
            fitness: 0,
            reading: 0,
            project: 0
        };

        tasks.forEach(task => {
            const name = task.name.toLowerCase();

            if (
                name.includes("code") ||
                name.includes("coding") ||
                name.includes("javascript") ||
                name.includes("python") ||
                name.includes("html") ||
                name.includes("css")
            ) {
                categories.coding++;
            }

            if (
                name.includes("study") ||
                name.includes("exam") ||
                name.includes("learn") ||
                name.includes("revision")
            ) {
                categories.study++;
            }

            if (
                name.includes("gym") ||
                name.includes("workout") ||
                name.includes("exercise") ||
                name.includes("fitness")
            ) {
                categories.fitness++;
            }

            if (
                name.includes("read") ||
                name.includes("book") ||
                name.includes("article")
            ) {
                categories.reading++;
            }

            if (
                name.includes("project") ||
                name.includes("assignment") ||
                name.includes("build")
            ) {
                categories.project++;
            }
        });

        const topCategory = Object.keys(categories).reduce((a, b) =>
            categories[a] > categories[b] ? a : b
        );

        const suggestions = {
    coding: [
        "💻 Practice coding for 2 hours",
        "🧠 Solve 3 DSA problems",
        "⚡ Build a mini JavaScript project"
    ],

    study: [
        "📘 Study important topics for 2 hours",
        "📝 Revise notes for upcoming exam",
        "🎯 Complete one learning module"
    ],

    fitness: [
        "💪 Workout for 1 hour",
        "🏃 Run for 30 minutes",
        "🔥 Complete a cardio session"
    ],

    reading: [
        "📖 Read 20 pages",
        "📚 Finish one chapter",
        "🧠 Read a technical article"
    ],

    project: [
        "🛠 Work on your project for 3 hours",
        "🚀 Improve UI of your application",
        "⚙ Fix backend API issues"
    ]
};

        let suggestion = "Complete more tasks to get smart recommendations.";

        if (categories[topCategory] > 0) {
            const randomIndex = Math.floor(
            Math.random() * suggestions[topCategory].length
        );

    suggestion =
    suggestions[topCategory][randomIndex];
        }

        res.json({
    model: "Rule-Based Recommendation Engine",
    topCategory,
    categories,
    suggestion,
    analyzedTasks: tasks.length
    });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: "Recommendation server error"
        });
    }
});

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
    res.send("Task Manager API is running");
});

/* ================= START SERVER ================= */

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});