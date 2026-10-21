import { pgTable, serial, text, real, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  imageName: text("image_name").notNull().default("leaf.jpg"),
  diseaseId: text("disease_id").notNull(),
  diseaseName: text("disease_name").notNull(),
  confidence: real("confidence").notNull(),
  severity: text("severity").notNull().default("Moderate"),
  severityScore: integer("severity_score").notNull().default(50),
  leafHealthScore: integer("leaf_health_score").notNull().default(70),
  affectedArea: real("affected_area").notNull().default(12),
  location: text("location").default("Dhaka, Bangladesh"),
  farmerName: text("farmer_name").default("Guest Farmer"),
  fieldId: text("field_id").default("Field A-12"),
  notes: text("notes"),
  isHealthy: boolean("is_healthy").notNull().default(false),
  feedback: text("feedback"), // correct | incorrect | null
  topPredictions: jsonb("top_predictions").$type<{ label: string; confidence: number }[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id"),
  farmerName: text("farmer_name").notNull(),
  phone: text("phone"),
  location: text("location").notNull(),
  diseaseName: text("disease_name"),
  question: text("question").notNull(),
  urgency: text("urgency").notNull().default("Medium"),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Scan = typeof scans.$inferSelect;
export type Consultation = typeof consultations.$inferSelect;
