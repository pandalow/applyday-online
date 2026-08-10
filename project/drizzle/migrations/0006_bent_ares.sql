CREATE TYPE "public"."generation_job_status" AS ENUM('pending', 'running', 'done', 'error');--> statement-breakpoint
CREATE TYPE "public"."generation_job_type" AS ENUM('insight', 'resume', 'cover', 'okr');--> statement-breakpoint
CREATE TABLE "generation_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "generation_job_type" NOT NULL,
	"resume_id" uuid,
	"status" "generation_job_status" DEFAULT 'pending' NOT NULL,
	"error" text,
	"api_key" text NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"reasoning" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"started_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_resume_id_resume_texts_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resume_texts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gen_jobs_app_idx" ON "generation_jobs" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "gen_jobs_user_idx" ON "generation_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gen_jobs_status_idx" ON "generation_jobs" USING btree ("status");