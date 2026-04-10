require('dotenv').config();
require('dns').setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const adminExists = await User.findOne({ email: 'admin@damoishop.com' });
        if (adminExists) {
            adminExists.role = 'admin';
            adminExists.password = '123456';
            await adminExists.save();
            console.log('Admin user updated to admin role');
        } else {
            await User.create({
                fullName: 'Admin Shop',
                email: 'admin@damoishop.com',
                password: '123456',
                role: 'admin'
            });
            console.log('Admin user created successfully');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
