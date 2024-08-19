const express = require("express");
const session = require("express-session");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const path = require("path");
const hbs = require("hbs");
const multer = require("multer");

const app = express();
const prisma = new PrismaClient();

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));

app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "public", "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "rahasia",
    resave: false,
    saveUninitialized: false,
  })
);

// Tambahkan rute untuk membuat project
app.get("/create-project", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const technologies = [
    { name: "Node JS", icon: "/public/assets/node-js.svg" },
    { name: "Next JS", icon: "/public/assets/next-js.svg" },
    { name: "React JS", icon: "/public/assets/react-js.svg" },
    { name: "TypeScript", icon: "/public/assets/typescript.svg" },
  ];
  res.render("create-project", { technologies });
});

app.post("/create-project", upload.single("image"), async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  const { name, description, start_date, end_date, checklist } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  // Pastikan checklist adalah array
  const techArray = Array.isArray(checklist)
    ? checklist
    : checklist
    ? [checklist]
    : [];

  try {
    await prisma.tb_projects.create({
      data: {
        name,
        description,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        technologies: techArray,
        image: image || undefined,
        user: {
          connect: {
            id: req.session.user.id
          }
        }
      },
      include: {
        user: true
      }
    });
    res.redirect("/my-projects");
  } catch (error) {
    console.error("Error creating project:", error);
    res.render("create-project", {
      error: "Gagal membuat project. Silakan coba lagi.",
      technologies,
      formData: {
        name,
        description,
        start_date,
        end_date,
        checklist: techArray,
      },
    });
  }
});

// Perbarui rute GET untuk halaman utama
app.get("/", async (req, res) => {
  let projects = [];
  if (req.session.user) {
    projects = await prisma.tb_projects.findMany({
      where: { userId: req.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }
  res.render("home", { user: req.session.user, projects });
});

app.get("/my-projects", async (req, res) => {
  let projects = [];
  if (req.session.user) {
    projects = await prisma.tb_projects.findMany({
      where: { userId: req.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }
  res.render("my-projects", { user: req.session.user, projects });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.tb_users.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    req.session.user = { id: user.id, name: user.name, email: user.email };
    res.redirect("/");
  } catch (error) {
    res.render("register", { error: "Email sudah terdaftar" });
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.tb_users.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      req.session.user = { id: user.id, name: user.name, email: user.email };
      res.redirect("/");
    } else {
      res.render("login", { email, error: "Email atau password salah" });
    }
  } catch (error) {
    res.render("login", { email, error: "Terjadi kesalahan" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Tambahkan rute untuk mengedit project
app.get("/edit-project/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const projectId = parseInt(req.params.id);

  try {
    const project = await prisma.tb_projects.findUnique({
      where: { id: projectId, userId: req.session.user.id },
    });

    if (!project) {
      return res.redirect("/");
    }

    const technologies = [
      { name: "Node JS", icon: "/public/assets/node-js.svg" },
      { name: "Next JS", icon: "/public/assets/next-js.svg" },
      { name: "React JS", icon: "/public/assets/react-js.svg" },
      { name: "TypeScript", icon: "/public/assets/typescript.svg" },
    ];

    res.render("edit-project", { project, technologies });
  } catch (error) {
    console.error("Error fetching project:", error);
    res.redirect("/");
  }
});

app.post("/edit-project/:id", upload.single("image"), async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const projectId = parseInt(req.params.id);

  try {
    const project = await prisma.tb_projects.findUnique({
      where: { id: projectId, userId: req.session.user.id },
    });

    if (!project) {
      return res.redirect("/");
    }

    const { name, description, start_date, end_date, checklist } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : project.image;

    // Pastikan checklist adalah array
    const techArray = Array.isArray(checklist)
      ? checklist
      : checklist
      ? [checklist]
      : [];

    await prisma.tb_projects.update({
      where: { id: projectId },
      data: {
        name,
        description,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        technologies: techArray,
        image,
      },
    });

    res.redirect("/");
  } catch (error) {
    console.error("Error updating project:", error);
    res.redirect("/");
  }
});

// Tambahkan rute untuk menghapus project
app.post("/delete-project/:id", async (req, res) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  const projectId = parseInt(req.params.id);

  try {
    await prisma.tb_projects.deleteMany({
      where: {
        id: projectId,
        userId: req.session.user.id,
      },
    });

    res.redirect("/my-projects");
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).send("Terjadi kesalahan saat menghapus project");
  }
});

app.get("/contact", (req, res) => {
  res.render("contact");
});

// Helper untuk memformat tanggal
hbs.registerHelper("formatDate", function (date) {
  return date.toLocaleDateString("id-ID");
});

// Helper untuk menggabungkan array
hbs.registerHelper("join", function (arr) {
  return arr.join(", ");
});

// Helper untuk memeriksa apakah teknologi sudah dipilih sebelumnya
hbs.registerHelper("isChecked", function (value, array) {
  return array && array.includes(value);
});

// Helper untuk memformat tanggal untuk input
hbs.registerHelper("formatDateForInput", function (date) {
  if (!date) return "";
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));