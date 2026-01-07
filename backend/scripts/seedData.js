import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Client from "../models/Client.js";
import Project from "../models/Project.js";
import Invoice from "../models/Invoice.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js"; // Added Payment model

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected for Seeding");
    } catch (err) {
        console.error("DB Connection Error:", err);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // Cleanup
        await Client.deleteMany({});
        await Project.deleteMany({});
        await Invoice.deleteMany({});
        await Payment.deleteMany({}); // Cleanup payments
        console.log("Cleared existing data.");

        // Fetch User
        const user = await User.findOne({ email: "pranjal@singaji.in" });
        if (!user) {
            console.error("User 'pranjal@singaji.in' not found. creating fall back.");
            // Fallback or exit? Assuming user exists from previous context.
            // If not found, find ANY user
            const anyUser = await User.findOne({});
            if (!anyUser) throw new Error("No users found in DB. Please register a user first.");
        }
        const userId = user ? user._id : (await User.findOne({}))._id;

        // 1. Create Clients
        const clients = await Client.create([
            {
                name: "Tech Corp Global",
                email: "contact@example.email",
                phone: "+1-555-0123",
                address: { street: "123 Tech Park", city: "San Francisco", state: "CA", country: "USA", pincode: "94105" },
                gst_number: "22AAAAA0000A1Z5",
                business_email: "business@email.com",
                finance_email: "finance@email.com"
            },
            {
                name: "Creative Studio Ltd",
                email: "example@email.com",
                phone: "+44-20-7946-0958",
                address: { street: "45 Design Ave", city: "London", country: "UK", pincode: "EC1A 1BB" },
                gst_number: "99BBBBB0000B1Z6"
            },
        ]);

        console.log(`Created ${clients.length} Clients`);

        // 2. Create Projects
        // Mix of statuses and types
        const projectData = [
            {
                name: "Website Redesign",
                client_id: clients[0]._id,
                user_id: userId,
                total_amount: 15000,
                status: "active",
                start_date: new Date("2025-01-10"),
                end_date: new Date("2025-03-30"), // Added end_date
                project_type: "fixed_contract",
                allocation_type: "overall",
                description: "Complete redesign of corporate website.",
            },
            {
                name: "Mobile App Dev",
                client_id: clients[0]._id,
                user_id: userId,
                total_amount: 25000,
                status: "active",
                start_date: new Date("2024-11-01"),
                end_date: new Date("2025-05-01"),
                project_type: "monthly_retainer",
                allocation_type: "employee_based",
                description: "iOS and Android app development.",
            },
            {
                name: "SEO Optimization",
                client_id: clients[1]._id,
                user_id: userId,
                total_amount: 5000,
                status: "completed",
                start_date: new Date("2024-09-01"),
                end_date: new Date("2024-12-01"),
                project_type: "hourly_billing",
                allocation_type: "overall",
            },
            {
                name: "Marketing Campaign",
                client_id: clients[1]._id,
                user_id: userId,
                total_amount: 12000,
                status: "draft",
                start_date: new Date("2025-02-01"),
                end_date: new Date("2025-04-01"),
                project_type: "fixed_contract",
            },
            {
                name: "Maintenance Support",
                client_id: clients[0]._id,
                user_id: userId,
                total_amount: 2000,
                status: "on_hold",
                start_date: new Date("2024-06-01"),
                project_type: "monthly_retainer", // No end date, ongoing
            },
            {
                name: "Legacy System Migration",
                client_id: clients[1]._id,
                user_id: userId,
                total_amount: 45000,
                status: "active",
                start_date: new Date("2025-01-01"),
                end_date: new Date("2025-12-31"),
                project_type: "fixed_contract",
                allocation_type: "employee_based",
            }
        ];

        const projects = await Project.create(projectData);
        console.log(`Created ${projects.length} Projects`);

        // 3. Create Invoices
        const invoicesData = [];
        const paymentsData = [];

        // Helper
        const generateInvNum = (num) => `INV-${new Date().getFullYear()}-${String(num).padStart(3, '0')}`;
        const statuses = ["draft", "sent", "paid", "overdue", "cancelled"];
        let statusIdx = 0;

        for (let i = 0; i < projects.length; i++) {
            const project = projects[i];

            // Invoice 1
            const status1 = statuses[statusIdx++ % statuses.length];
            const amount1 = 5000;
            const gst1 = amount1 * 0.18;
            const total1 = amount1 + gst1;

            const inv1 = {
                project_id: project._id,
                invoice_number: generateInvNum(i * 2 + 1),
                amount: amount1,
                currency: "INR",
                status: status1,
                issue_date: new Date(),
                due_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                subtotal: amount1,
                gst_percentage: 18,
                gst_amount: gst1,
                total_amount: total1,
                paid_amount: status1 === "paid" ? total1 : 0,
                balance_due: status1 === "paid" ? 0 : total1,
                services: [{ description: "Phase 1 Services", amount: amount1 }],
            };
            invoicesData.push(inv1);


            // Invoice 2
            const status2 = statuses[statusIdx++ % statuses.length];
            const amount2 = 3000;
            const gst2 = amount2 * 0.18;
            const total2 = amount2 + gst2;

            const inv2 = {
                project_id: project._id,
                invoice_number: generateInvNum(i * 2 + 2),
                amount: amount2,
                currency: "INR",
                status: status2,
                issue_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last month
                due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Overdue if unpaid
                subtotal: amount2,
                gst_percentage: 18,
                gst_amount: gst2,
                total_amount: total2,
                paid_amount: status2 === "paid" ? total2 : 0,
                balance_due: status2 === "paid" ? 0 : total2,
                services: [{ description: "Additional Support", amount: amount2 }],
            };
            invoicesData.push(inv2);
        }

        const createdInvoices = await Invoice.create(invoicesData);
        console.log(`Created ${createdInvoices.length} Invoices`);

        // 4. Create Payments for "paid" invoices
        for (const inv of createdInvoices) {
            if (inv.status === "paid") {
                paymentsData.push({
                    invoice_id: inv._id,
                    project_id: inv.project_id,
                    amount: inv.total_amount, // Paid full amount
                    currency: "INR",
                    payment_method: "bank_account",
                    payment_date: new Date(),
                });
            }
        }

        if (paymentsData.length > 0) {
            await Payment.create(paymentsData);
            console.log(`Created ${paymentsData.length} Payments`);
        }

        console.log("✨ Seeding completed successfully!");
        process.exit(0);

    } catch (err) {
        console.error("Seeding Error:", JSON.stringify(err, null, 2));
        process.exit(1);
    }
};

seedData();
