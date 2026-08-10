CREATE TABLE "job_insights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid,
	"content" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "job_insights" ADD CONSTRAINT "job_insights_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_insights" ADD CONSTRAINT "job_insights_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_insights" ADD CONSTRAINT "job_insights_resume_id_resume_texts_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resume_texts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "job_insights_app_idx" ON "job_insights" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "job_insights_user_idx" ON "job_insights" USING btree ("user_id");