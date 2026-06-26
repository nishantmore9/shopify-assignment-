import mongoose from 'mongoose';

const announcementSchame = new mongoose.Schema({
  shop: {
    type : String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Announcement', announcementSchame);