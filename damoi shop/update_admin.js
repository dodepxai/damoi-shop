require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/damoi_shop_db');
        const User = require('./models/User');
        const admin = await User.findOne({ role: 'admin' });
        if (admin) {
            admin.phone = '0837290135';
            admin.password = '1';
            await admin.save();
            console.log('✅ Updated existing admin credentials.');
        } else {
            console.log('Admin not found.');
        }
        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
};

updateAdmin();
