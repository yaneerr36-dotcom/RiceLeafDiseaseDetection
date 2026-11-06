ALTER TABLE consultations ADD COLUMN user_id text;--> statement-breakpoint
ALTER TABLE consultations ADD CONSTRAINT consultations_user_id_user_id_fk FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX consultations_userId_idx ON consultations USING btree (user_id);
