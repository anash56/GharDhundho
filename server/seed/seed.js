import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User, Listing, Enquiry, SavedListing } from "../src/models/index.js";

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ghardhundho";
await mongoose.connect(mongoUri);
await Promise.all([
  User.deleteMany({}),
  Listing.deleteMany({}),
  Enquiry.deleteMany({}),
  SavedListing.deleteMany({}),
]);

const password = await bcrypt.hash("Password123!", 12);
const users = await User.create([
  {
    name: "Admin",
    email: "admin@example.com",
    phone: "9000000000",
    password,
    role: "admin",
    isVerified: true,
  },
  {
    name: "Aarav Shah",
    email: "owner1@example.com",
    phone: "9876543210",
    password,
    role: "owner",
    isVerified: true,
  },
  {
    name: "Mira Patel",
    email: "owner2@example.com",
    phone: "9876543211",
    password,
    role: "owner",
  },
  {
    name: "Riya Mehta",
    email: "seeker1@example.com",
    phone: "9876543212",
    password,
    role: "seeker",
  },
  {
    name: "Kabir Joshi",
    email: "seeker2@example.com",
    phone: "9876543213",
    password,
    role: "seeker",
  },
]);
const cities = [
  ["Ahmedabad", ["Navrangpura", "Satellite", "Vastrapur", "Bopal"]],
  ["Surat", ["Adajan", "Vesu", "Athwa", "Piplod"]],
  ["Pune", ["Kothrud", "Baner", "Hinjawadi", "Viman Nagar"]],
  ["Vadodara", ["Alkapuri", "Manjalpur", "Gotri", "Karelibaug"]],
  ["Jaipur", ["Malviya Nagar", "Vaishali Nagar", "Mansarovar", "Jagatpura"]],
  ["Indore", ["Vijay Nagar", "Palasia", "Rau", "Bhawarkua"]],
  ["Nagpur", ["Dharampeth", "Manish Nagar", "Bajaj Nagar", "Wardhaman Nagar"]],
  ["Lucknow", ["Gomti Nagar", "Aliganj", "Hazratganj", "Indira Nagar"]],
  ["Bhopal", ["Arera Colony", "Kolar Road", "MP Nagar", "Bawadia Kalan"]],
];
const types = ["room", "flat", "pg"];
const photos = [
  "1600607687939-ce8a6c25118c",
  "1600210492486-724fe5c67fb0",
  "1600607687920-4e2a09cf159d",
];
const docs = cities.flatMap(([city, localities], cityIndex) =>
  localities.map((locality, index) => ({
    owner: users[1 + (index % 2)]._id,
    title: `Bright ${types[index % 3]} in ${locality}`,
    description: `A comfortable, well-connected ${types[index % 3]} with a welcoming community. Close to daily essentials and public transport.`,
    city,
    locality,
    address: `${locality}, ${city}`,
    propertyType: types[index % 3],
    rent: 7000 + index * 2500 + cityIndex * 1000,
    deposit: 10000 + index * 2000,
    availableFor: ["anyone", "boys", "girls", "family"][index % 4],
    furnishing: ["furnished", "semi", "unfurnished"][index % 3],
    amenities: ["wifi", "parking", ...(index % 2 ? ["laundry"] : ["food"])],
    images: photos.map((photo) => ({
      url: `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=1000&q=80`,
      publicId: "",
    })),
  })),
);
await Listing.insertMany(docs);
console.log(`Seeded admin, owners, seekers, and ${docs.length} listings.`);
await mongoose.disconnect();
