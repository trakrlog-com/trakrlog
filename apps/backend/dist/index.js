"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const common_1 = require("@trakrlog/common");
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Example endpoint using shared types
app.post('/api/users', (req, res) => {
    const userData = req.body;
    if (!(0, common_1.isValidEmail)(userData.email)) {
        return res.status(400).json({ error: 'Invalid email address' });
    }
    // Here you would typically save the user to a database
    res.status(201).json(userData);
});
app.listen(port, () => {
    console.log(`Backend server running at http://localhost:${port}`);
});
