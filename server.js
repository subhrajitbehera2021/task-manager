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

const supabaseUrl = "https://yamytpjuaezppgwugsor.supabase.co";
const supabaseKey = "sb_publishable_hNQF8DSuzflzxtc4M6sr3g_5wdScKEj";

const supabase = createClient(supabaseUrl, supabaseKey);

console.log("Supabase Connected");

/* ================= AUTH MIDDLEWARE ================= */

const auth = async (req, res, next) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ message: "No token" });
    }

    try {
        const decoded = jwt.verify(token, "secretkey");
        req.userId = decoded.id;
        next();

    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};

/* ================= AUTH ROUTES ================= */

// ➕ SIGNUP
app.post("/api/signup", async (req, res) => {
    try {

        const { name, email, password } = req.body;

        // CHECK EXISTING USER
        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }

        // HASH PASSWORD
        const hashedPassword = await bcrypt.hash(password, 10);

        // INSERT USER
        const { data, error } = await supabase
            .from("users")
            .insert([
                {
                    name,
                    email,
                    password: hashedPassword
                }
            ])
            .select();

        if (error) {
            console.log(error);
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

// 🔐 LOGIN
app.post("/api/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        // FIND USER
        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", email)
            .single();

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        // CHECK PASSWORD
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Wrong password"
            });
        }

        // CREATE TOKEN
        const token = jwt.sign(
            { id: user.id },
            "secretkey",
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

// ➕ ADD TASK
app.post("/api/tasks", auth, async (req, res) => {

    try {

        const { name, status, deadline } = req.body;

        const { data, error } = await supabase
            .from("tasks")
            .insert([
                {
                    name,
                    status: status || "pending",
                    deadline,
                    user_id: req.userId
                }
            ])
            .select();

        if (error) {
            console.log(error);
            return res.status(500).json({
                message: "Error adding task"
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

// 📥 GET TASKS
app.get("/api/tasks", auth, async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .eq("user_id", req.userId)
            .order("id", { ascending: false });

        if (error) {
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

// ✏️ UPDATE TASK
app.put("/api/tasks/:id", auth, async (req, res) => {

    try {

        const { name, status, deadline } = req.body;

        const { data, error } = await supabase
            .from("tasks")
            .update({
                name,
                status,
                deadline
            })
            .eq("id", req.params.id)
            .select();

        if (error) {
            return res.status(500).json({
                message: "Error updating task"
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

// ❌ DELETE TASK
app.delete("/api/tasks/:id", auth, async (req, res) => {

    try {

        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", req.params.id);

        if (error) {
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

/* ================= START SERVER ================= */

app.listen(5000, () => {
    console.log("Server running on port 5000");
});