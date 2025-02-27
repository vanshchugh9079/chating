import mongoose from "mongoose";

const storySchema = new mongoose.Schema({
  media: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Expire after 24 hours (7200 seconds)
  },
});

const Story = mongoose.model('Story', storySchema);

export default Story;
