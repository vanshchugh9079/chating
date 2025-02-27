import User from "../../models/User.js";

const searchUser = async (req, res) => {
    try {
        const name = req.params.name;
        if (!name) {
            return res.status(400).json({ message: "Name parameter is required" });
        }
        // Use a case-insensitive regex query to find users whose names start with the given input
        const users = await User.find({
            name: { $regex: `^${name}`, $options: "i" },
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching users:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export default searchUser;
