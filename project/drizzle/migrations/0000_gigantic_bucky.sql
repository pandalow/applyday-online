CREATE TYPE "public"."application_status" AS ENUM('prepared', 'applied', 'interviewed', 'offered', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('full_time', 'contract', 'internship', 'part_time');--> statement-breakpoint
CREATE TYPE "public"."level" AS ENUM('intern', 'junior', 'mid', 'senior', 'lead', 'manager');--> statement-breakpoint
CREATE TYPE "public"."remote_work" AS ENUM('on-site', 'hybrid', 'remote');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "analysis_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" "report_status" DEFAULT 'done' NOT NULL,
	"application_ids" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "analysis_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_okrs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company" varchar(255) NOT NULL,
	"job_title" varchar(255) NOT NULL,
	"application_date" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" "application_status" DEFAULT 'prepared' NOT NULL,
	"stage_notes" text,
	"channel" varchar(100)
);
--> statement-breakpoint
CREATE TABLE "job_description_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"application_id" uuid,
	"text" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_descriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_text_id" uuid NOT NULL,
	"company" varchar(255),
	"role" varchar(255),
	"level" "level",
	"location" varchar(255),
	"employment_type" "employment_type",
	"salary_eur_min" real,
	"salary_eur_max" real,
	"bonus_percent" real,
	"years_experience_min" integer,
	"years_experience_max" integer,
	"education_required" text,
	"benefits" jsonb DEFAULT '[]'::jsonb,
	"responsibilities" jsonb DEFAULT '[]'::jsonb,
	"required_core_skills" jsonb DEFAULT '[]'::jsonb,
	"desirable_skills" jsonb DEFAULT '[]'::jsonb,
	"programming_languages" jsonb DEFAULT '[]'::jsonb,
	"frameworks_tools" jsonb DEFAULT '[]'::jsonb,
	"databases" jsonb DEFAULT '[]'::jsonb,
	"cloud_platforms" jsonb DEFAULT '[]'::jsonb,
	"api_protocols" jsonb DEFAULT '[]'::jsonb,
	"methodologies" jsonb DEFAULT '[]'::jsonb,
	"mobile_technologies" jsonb DEFAULT '[]'::jsonb,
	"domain_keywords" jsonb DEFAULT '[]'::jsonb,
	"language_requirements" jsonb DEFAULT '[]'::jsonb,
	"remote_work" "remote_work",
	"work_permit_required" boolean,
	"visa_sponsorship" boolean,
	"contact_person" varchar(255),
	"contact_email_or_phone" varchar(255),
	"industry" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_descriptions_job_text_id_unique" UNIQUE("job_text_id")
);
--> statement-breakpoint
CREATE TABLE "resume_texts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"text" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "summaries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"rsa_public_key" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "analysis_reports" ADD CONSTRAINT "analysis_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_results" ADD CONSTRAINT "analysis_results_report_id_analysis_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."analysis_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_okrs" ADD CONSTRAINT "application_okrs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_okrs" ADD CONSTRAINT "application_okrs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_description_texts" ADD CONSTRAINT "job_description_texts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_description_texts" ADD CONSTRAINT "job_description_texts_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_job_text_id_job_description_texts_id_fk" FOREIGN KEY ("job_text_id") REFERENCES "public"."job_description_texts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resume_texts" ADD CONSTRAINT "resume_texts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "summaries" ADD CONSTRAINT "summaries_report_id_analysis_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."analysis_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "reports_user_idx" ON "analysis_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "okrs_app_idx" ON "application_okrs" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "okrs_user_idx" ON "application_okrs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "applications_user_idx" ON "applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jdt_user_idx" ON "job_description_texts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resumes_user_idx" ON "resume_texts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");