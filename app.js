import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./config/db.js";
import router from "./routes/index.js";
import CommunityRoute from "./routes/CommunityRoute.js";
import GalleryRoute from "./routes/GalleryRoute.js";
import ActivityRoute from "./routes/ActivityRoute.js";

import "./models/userModel.js";
import "./models/communityModel.js";
import "./models/activityModel.js";
import "./models/memberModel.js";
import "./models/galleryModel.js";
import "./models/likeModel.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.use(router)
app.use(CommunityRoute);
app.use(GalleryRoute);
app.use(ActivityRoute);

try {
    await db.authenticate();
    console.log('Database Connected...');

    await db.sync(); 
    console.log('All models were synchronized successfully.');
} catch (error) {
    console.error('Connection error:', error);
}

app.get('/', (req, res) => {
    res.send('Server HobbyYK is Running!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));