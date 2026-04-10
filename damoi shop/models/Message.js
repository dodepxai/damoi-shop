const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Nếu khách vãng lai, để null
    },
    senderName: {
        type: String,
        default: 'Khách'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Admin nhận thì receiver để null (hoặc ID admin)
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    isAdmin: {
        type: Boolean,
        default: false // Tin nhắn gửi từ admin
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isPriority: {
        type: Boolean,
        default: false
    },
    userId: {
        type: String, // ID định danh cuộc trò chuyện (có thể là User._id hoặc random string cho khách vãng lai)
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
