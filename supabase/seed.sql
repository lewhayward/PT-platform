-- ============================================================================
-- PT Platform - exercise library & starter programme content
--
-- HOW TO RUN THIS:
-- Run this AFTER schema.sql (it needs the tables schema.sql creates).
-- Open the Supabase SQL Editor, paste this whole file in, and click Run.
--
-- Safe to re-run: exercises are only ever added, never removed (a trainer
-- may already be using one in a real client's programme, so deleting one
-- could break their data). Starter templates are fully replaced each time,
-- since nothing in a client's live programme depends on them staying put -
-- applying a template just copies its exercises in once.
-- ============================================================================

insert into public.exercises (name, muscle_group, equipment) values
  ('Barbell Bench Press', 'chest', 'Barbell'),
  ('Incline Barbell Bench Press', 'chest', 'Barbell'),
  ('Decline Barbell Bench Press', 'chest', 'Barbell'),
  ('Dumbbell Bench Press', 'chest', 'Dumbbells'),
  ('Incline Dumbbell Press', 'chest', 'Dumbbells'),
  ('Dumbbell Flyes', 'chest', 'Dumbbells'),
  ('Incline Dumbbell Flyes', 'chest', 'Dumbbells'),
  ('Cable Crossover', 'chest', 'Cable'),
  ('Low-to-High Cable Fly', 'chest', 'Cable'),
  ('Push-Ups', 'chest', 'Bodyweight'),
  ('Dips (Chest Focus)', 'chest', 'Dip bars'),
  ('Machine Chest Press', 'chest', 'Machine'),
  ('Pec Deck', 'chest', 'Machine'),
  ('Smith Machine Bench Press', 'chest', 'Smith machine'),
  ('Landmine Press', 'chest', 'Barbell'),

  ('Conventional Deadlift', 'back', 'Barbell'),
  ('Sumo Deadlift', 'back', 'Barbell'),
  ('Barbell Row', 'back', 'Barbell'),
  ('Pendlay Row', 'back', 'Barbell'),
  ('Pull-Ups', 'back', 'Bodyweight'),
  ('Chin-Ups', 'back', 'Bodyweight'),
  ('Lat Pulldown', 'back', 'Cable'),
  ('Reverse Grip Lat Pulldown', 'back', 'Cable'),
  ('Seated Cable Row', 'back', 'Cable'),
  ('Single-Arm Dumbbell Row', 'back', 'Dumbbells'),
  ('T-Bar Row', 'back', 'Barbell'),
  ('Face Pull', 'back', 'Cable'),
  ('Straight-Arm Pulldown', 'back', 'Cable'),
  ('Hyperextensions', 'back', 'Bodyweight'),
  ('Rack Pulls', 'back', 'Barbell'),
  ('Meadows Row', 'back', 'Barbell'),
  ('Machine Row', 'back', 'Machine'),

  ('Barbell Overhead Press', 'shoulders', 'Barbell'),
  ('Dumbbell Shoulder Press', 'shoulders', 'Dumbbells'),
  ('Arnold Press', 'shoulders', 'Dumbbells'),
  ('Lateral Raise', 'shoulders', 'Dumbbells'),
  ('Cable Lateral Raise', 'shoulders', 'Cable'),
  ('Front Raise', 'shoulders', 'Dumbbells'),
  ('Cable Front Raise', 'shoulders', 'Cable'),
  ('Rear Delt Flye', 'shoulders', 'Dumbbells'),
  ('Reverse Pec Deck', 'shoulders', 'Machine'),
  ('Upright Row', 'shoulders', 'Barbell'),
  ('Barbell Shrugs', 'shoulders', 'Barbell'),
  ('Dumbbell Shrugs', 'shoulders', 'Dumbbells'),
  ('Machine Shoulder Press', 'shoulders', 'Machine'),

  ('Barbell Curl', 'arms', 'Barbell'),
  ('EZ-Bar Curl', 'arms', 'EZ bar'),
  ('Dumbbell Curl', 'arms', 'Dumbbells'),
  ('Hammer Curl', 'arms', 'Dumbbells'),
  ('Preacher Curl', 'arms', 'Barbell'),
  ('Cable Curl', 'arms', 'Cable'),
  ('Concentration Curl', 'arms', 'Dumbbells'),
  ('Reverse Curl', 'arms', 'Barbell'),
  ('Close-Grip Bench Press', 'arms', 'Barbell'),
  ('Tricep Pushdown', 'arms', 'Cable'),
  ('Rope Pushdown', 'arms', 'Cable'),
  ('Overhead Tricep Extension', 'arms', 'Dumbbells'),
  ('Skull Crushers', 'arms', 'EZ bar'),
  ('Dips (Tricep Focus)', 'arms', 'Dip bars'),
  ('Cable Kickback', 'arms', 'Cable'),
  ('Diamond Push-Ups', 'arms', 'Bodyweight'),

  ('Barbell Back Squat', 'legs', 'Barbell'),
  ('Front Squat', 'legs', 'Barbell'),
  ('Hack Squat', 'legs', 'Machine'),
  ('Leg Press', 'legs', 'Machine'),
  ('Romanian Deadlift', 'legs', 'Barbell'),
  ('Leg Curl', 'legs', 'Machine'),
  ('Leg Extension', 'legs', 'Machine'),
  ('Walking Lunges', 'legs', 'Dumbbells'),
  ('Bulgarian Split Squat', 'legs', 'Dumbbells'),
  ('Hip Thrust', 'legs', 'Barbell'),
  ('Glute Bridge', 'legs', 'Bodyweight'),
  ('Standing Calf Raise', 'legs', 'Machine'),
  ('Seated Calf Raise', 'legs', 'Machine'),
  ('Goblet Squat', 'legs', 'Dumbbell'),
  ('Step-Ups', 'legs', 'Dumbbells'),
  ('Box Jump', 'legs', 'Bodyweight'),
  ('Pistol Squat', 'legs', 'Bodyweight'),

  ('Plank', 'core', 'Bodyweight'),
  ('Side Plank', 'core', 'Bodyweight'),
  ('Hanging Leg Raise', 'core', 'Bodyweight'),
  ('Cable Crunch', 'core', 'Cable'),
  ('Russian Twist', 'core', 'Bodyweight'),
  ('Ab Wheel Rollout', 'core', 'Ab wheel'),
  ('Sit-Ups', 'core', 'Bodyweight'),
  ('Bicycle Crunch', 'core', 'Bodyweight'),
  ('Mountain Climbers', 'core', 'Bodyweight'),
  ('Dead Bug', 'core', 'Bodyweight'),
  ('Woodchopper', 'core', 'Cable'),
  ('Pallof Press', 'core', 'Cable'),

  ('Treadmill Run', 'cardio', 'Treadmill'),
  ('Stationary Bike', 'cardio', 'Bike'),
  ('Rowing Machine', 'cardio', 'Rower'),
  ('Stair Climber', 'cardio', 'Machine'),
  ('Jump Rope', 'cardio', 'Rope'),
  ('Elliptical', 'cardio', 'Machine'),
  ('Incline Walk', 'cardio', 'Treadmill'),
  ('Sprint Intervals', 'cardio', 'Track or treadmill'),
  ('Assault Bike', 'cardio', 'Bike'),
  ('Battle Ropes', 'cardio', 'Ropes'),

  ('Burpees', 'full_body', 'Bodyweight'),
  ('Kettlebell Swing', 'full_body', 'Kettlebell'),
  ('Clean and Press', 'full_body', 'Barbell'),
  ('Thruster', 'full_body', 'Barbell'),
  ('Turkish Get-Up', 'full_body', 'Kettlebell'),
  ('Farmer''s Carry', 'full_body', 'Dumbbells'),
  ('Man Makers', 'full_body', 'Dumbbells'),
  ('Wall Balls', 'full_body', 'Medicine ball')
on conflict (name) do nothing;

-- Clear out old starter content so this script can be re-run safely after
-- content changes, without ever touching a trainer's own saved templates or
-- a client's live programme.
delete from public.programme_template_days;
delete from public.programme_templates;
delete from public.workout_template_exercises
  where template_id in (select id from public.workout_templates where trainer_id is null);
delete from public.workout_templates where trainer_id is null;

insert into public.workout_templates (name) values
  ('Push Day (Bodybuilding)'),
  ('Pull Day (Bodybuilding)'),
  ('Legs Day (Bodybuilding)'),
  ('Upper Body A (Bodybuilding)'),
  ('Lower Body A (Bodybuilding)'),
  ('Upper Body B (Bodybuilding)'),
  ('Lower Body B (Bodybuilding)'),
  ('Chest Day (Bodybuilding)'),
  ('Back Day (Bodybuilding)'),
  ('Shoulders Day (Bodybuilding)'),
  ('Legs Day (Bro Split)'),
  ('Arms Day (Bodybuilding)'),
  ('Full Body A (Fat Loss)'),
  ('Full Body B (Fat Loss)'),
  ('Upper Body (Fat Loss)'),
  ('Lower Body (Fat Loss)'),
  ('Conditioning A (Fat Loss)'),
  ('Conditioning B (Fat Loss)'),
  ('Full Body A (General Fitness)'),
  ('Full Body B (General Fitness)'),
  ('Full Body C (General Fitness)'),
  ('Upper Body (Strength)'),
  ('Lower Body (Strength)');

insert into public.workout_template_exercises (template_id, exercise_id, sets, reps, order_index)
select t.id, e.id, x.sets, x.reps, x.order_index
from (values
  ('Push Day (Bodybuilding)', 'Barbell Bench Press', 4, '8-10', 1),
  ('Push Day (Bodybuilding)', 'Incline Dumbbell Press', 3, '10-12', 2),
  ('Push Day (Bodybuilding)', 'Machine Chest Press', 3, '12-15', 3),
  ('Push Day (Bodybuilding)', 'Lateral Raise', 3, '12-15', 4),
  ('Push Day (Bodybuilding)', 'Tricep Pushdown', 3, '12-15', 5),
  ('Push Day (Bodybuilding)', 'Overhead Tricep Extension', 3, '12', 6),

  ('Pull Day (Bodybuilding)', 'Conventional Deadlift', 3, '6-8', 1),
  ('Pull Day (Bodybuilding)', 'Barbell Row', 4, '8-10', 2),
  ('Pull Day (Bodybuilding)', 'Lat Pulldown', 3, '10-12', 3),
  ('Pull Day (Bodybuilding)', 'Seated Cable Row', 3, '12', 4),
  ('Pull Day (Bodybuilding)', 'Face Pull', 3, '15', 5),
  ('Pull Day (Bodybuilding)', 'Barbell Curl', 3, '10-12', 6),

  ('Legs Day (Bodybuilding)', 'Barbell Back Squat', 4, '8-10', 1),
  ('Legs Day (Bodybuilding)', 'Romanian Deadlift', 3, '10', 2),
  ('Legs Day (Bodybuilding)', 'Leg Press', 3, '12', 3),
  ('Legs Day (Bodybuilding)', 'Leg Curl', 3, '12-15', 4),
  ('Legs Day (Bodybuilding)', 'Leg Extension', 3, '12-15', 5),
  ('Legs Day (Bodybuilding)', 'Standing Calf Raise', 4, '15', 6),

  ('Upper Body A (Bodybuilding)', 'Barbell Bench Press', 4, '8', 1),
  ('Upper Body A (Bodybuilding)', 'Barbell Row', 4, '8', 2),
  ('Upper Body A (Bodybuilding)', 'Dumbbell Shoulder Press', 3, '10', 3),
  ('Upper Body A (Bodybuilding)', 'Lat Pulldown', 3, '10-12', 4),
  ('Upper Body A (Bodybuilding)', 'Barbell Curl', 3, '12', 5),
  ('Upper Body A (Bodybuilding)', 'Tricep Pushdown', 3, '12', 6),

  ('Lower Body A (Bodybuilding)', 'Barbell Back Squat', 4, '8', 1),
  ('Lower Body A (Bodybuilding)', 'Romanian Deadlift', 3, '10', 2),
  ('Lower Body A (Bodybuilding)', 'Leg Press', 3, '12', 3),
  ('Lower Body A (Bodybuilding)', 'Leg Curl', 3, '12', 4),
  ('Lower Body A (Bodybuilding)', 'Standing Calf Raise', 4, '15', 5),

  ('Upper Body B (Bodybuilding)', 'Incline Dumbbell Press', 4, '10', 1),
  ('Upper Body B (Bodybuilding)', 'Seated Cable Row', 4, '10', 2),
  ('Upper Body B (Bodybuilding)', 'Arnold Press', 3, '10', 3),
  ('Upper Body B (Bodybuilding)', 'Pull-Ups', 3, 'AMRAP', 4),
  ('Upper Body B (Bodybuilding)', 'Hammer Curl', 3, '12', 5),
  ('Upper Body B (Bodybuilding)', 'Skull Crushers', 3, '12', 6),

  ('Lower Body B (Bodybuilding)', 'Front Squat', 4, '8', 1),
  ('Lower Body B (Bodybuilding)', 'Hip Thrust', 3, '10', 2),
  ('Lower Body B (Bodybuilding)', 'Walking Lunges', 3, '12', 3),
  ('Lower Body B (Bodybuilding)', 'Leg Extension', 3, '15', 4),
  ('Lower Body B (Bodybuilding)', 'Seated Calf Raise', 4, '15', 5),

  ('Chest Day (Bodybuilding)', 'Barbell Bench Press', 4, '8', 1),
  ('Chest Day (Bodybuilding)', 'Incline Dumbbell Press', 4, '10', 2),
  ('Chest Day (Bodybuilding)', 'Dumbbell Flyes', 3, '12', 3),
  ('Chest Day (Bodybuilding)', 'Cable Crossover', 3, '15', 4),
  ('Chest Day (Bodybuilding)', 'Dips (Chest Focus)', 3, 'AMRAP', 5),

  ('Back Day (Bodybuilding)', 'Conventional Deadlift', 3, '6', 1),
  ('Back Day (Bodybuilding)', 'Pull-Ups', 4, 'AMRAP', 2),
  ('Back Day (Bodybuilding)', 'Barbell Row', 4, '8', 3),
  ('Back Day (Bodybuilding)', 'Seated Cable Row', 3, '12', 4),
  ('Back Day (Bodybuilding)', 'Straight-Arm Pulldown', 3, '15', 5),

  ('Shoulders Day (Bodybuilding)', 'Barbell Overhead Press', 4, '8', 1),
  ('Shoulders Day (Bodybuilding)', 'Lateral Raise', 4, '12-15', 2),
  ('Shoulders Day (Bodybuilding)', 'Rear Delt Flye', 3, '15', 3),
  ('Shoulders Day (Bodybuilding)', 'Front Raise', 3, '12', 4),
  ('Shoulders Day (Bodybuilding)', 'Barbell Shrugs', 3, '12', 5),

  ('Legs Day (Bro Split)', 'Barbell Back Squat', 4, '8', 1),
  ('Legs Day (Bro Split)', 'Leg Press', 4, '12', 2),
  ('Legs Day (Bro Split)', 'Romanian Deadlift', 3, '10', 3),
  ('Legs Day (Bro Split)', 'Leg Curl', 3, '12', 4),
  ('Legs Day (Bro Split)', 'Leg Extension', 3, '15', 5),
  ('Legs Day (Bro Split)', 'Standing Calf Raise', 4, '15', 6),

  ('Arms Day (Bodybuilding)', 'Barbell Curl', 4, '10', 1),
  ('Arms Day (Bodybuilding)', 'Close-Grip Bench Press', 4, '10', 2),
  ('Arms Day (Bodybuilding)', 'Hammer Curl', 3, '12', 3),
  ('Arms Day (Bodybuilding)', 'Tricep Pushdown', 3, '12', 4),
  ('Arms Day (Bodybuilding)', 'Preacher Curl', 3, '12', 5),
  ('Arms Day (Bodybuilding)', 'Cable Kickback', 3, '15', 6),

  ('Full Body A (Fat Loss)', 'Barbell Back Squat', 3, '10', 1),
  ('Full Body A (Fat Loss)', 'Dumbbell Bench Press', 3, '10', 2),
  ('Full Body A (Fat Loss)', 'Seated Cable Row', 3, '12', 3),
  ('Full Body A (Fat Loss)', 'Kettlebell Swing', 3, '15', 4),
  ('Full Body A (Fat Loss)', 'Plank', 3, '45s', 5),

  ('Full Body B (Fat Loss)', 'Romanian Deadlift', 3, '10', 1),
  ('Full Body B (Fat Loss)', 'Dumbbell Shoulder Press', 3, '10', 2),
  ('Full Body B (Fat Loss)', 'Lat Pulldown', 3, '12', 3),
  ('Full Body B (Fat Loss)', 'Walking Lunges', 3, '12', 4),
  ('Full Body B (Fat Loss)', 'Mountain Climbers', 3, '30s', 5),

  ('Upper Body (Fat Loss)', 'Dumbbell Bench Press', 3, '12', 1),
  ('Upper Body (Fat Loss)', 'Seated Cable Row', 3, '12', 2),
  ('Upper Body (Fat Loss)', 'Dumbbell Shoulder Press', 3, '12', 3),
  ('Upper Body (Fat Loss)', 'Lat Pulldown', 3, '12', 4),
  ('Upper Body (Fat Loss)', 'Cable Curl', 2, '15', 5),
  ('Upper Body (Fat Loss)', 'Tricep Pushdown', 2, '15', 6),

  ('Lower Body (Fat Loss)', 'Goblet Squat', 3, '12', 1),
  ('Lower Body (Fat Loss)', 'Romanian Deadlift', 3, '12', 2),
  ('Lower Body (Fat Loss)', 'Walking Lunges', 3, '12', 3),
  ('Lower Body (Fat Loss)', 'Leg Curl', 3, '15', 4),
  ('Lower Body (Fat Loss)', 'Standing Calf Raise', 3, '15', 5),

  ('Conditioning A (Fat Loss)', 'Rowing Machine', 1, '10 min', 1),
  ('Conditioning A (Fat Loss)', 'Battle Ropes', 5, '30s', 2),
  ('Conditioning A (Fat Loss)', 'Kettlebell Swing', 4, '15', 3),
  ('Conditioning A (Fat Loss)', 'Burpees', 4, '12', 4),
  ('Conditioning A (Fat Loss)', 'Plank', 3, '45s', 5),

  ('Conditioning B (Fat Loss)', 'Assault Bike', 1, '10 min', 1),
  ('Conditioning B (Fat Loss)', 'Jump Rope', 5, '1 min', 2),
  ('Conditioning B (Fat Loss)', 'Thruster', 4, '10', 3),
  ('Conditioning B (Fat Loss)', 'Mountain Climbers', 4, '30s', 4),
  ('Conditioning B (Fat Loss)', 'Russian Twist', 3, '20', 5),

  ('Full Body A (General Fitness)', 'Barbell Back Squat', 3, '10', 1),
  ('Full Body A (General Fitness)', 'Dumbbell Bench Press', 3, '10', 2),
  ('Full Body A (General Fitness)', 'Seated Cable Row', 3, '10', 3),
  ('Full Body A (General Fitness)', 'Plank', 3, '30s', 4),

  ('Full Body B (General Fitness)', 'Romanian Deadlift', 3, '10', 1),
  ('Full Body B (General Fitness)', 'Dumbbell Shoulder Press', 3, '10', 2),
  ('Full Body B (General Fitness)', 'Lat Pulldown', 3, '10', 3),
  ('Full Body B (General Fitness)', 'Dead Bug', 3, '12', 4),

  ('Full Body C (General Fitness)', 'Leg Press', 3, '12', 1),
  ('Full Body C (General Fitness)', 'Incline Dumbbell Press', 3, '10', 2),
  ('Full Body C (General Fitness)', 'Single-Arm Dumbbell Row', 3, '10', 3),
  ('Full Body C (General Fitness)', 'Bicycle Crunch', 3, '15', 4),

  ('Upper Body (Strength)', 'Barbell Bench Press', 5, '5', 1),
  ('Upper Body (Strength)', 'Barbell Row', 5, '5', 2),
  ('Upper Body (Strength)', 'Barbell Overhead Press', 3, '5', 3),
  ('Upper Body (Strength)', 'Pull-Ups', 3, 'AMRAP', 4),

  ('Lower Body (Strength)', 'Barbell Back Squat', 5, '5', 1),
  ('Lower Body (Strength)', 'Conventional Deadlift', 3, '5', 2),
  ('Lower Body (Strength)', 'Hip Thrust', 3, '8', 3),
  ('Lower Body (Strength)', 'Standing Calf Raise', 3, '12', 4)
) as x(template_name, exercise_name, sets, reps, order_index)
join public.workout_templates t on t.name = x.template_name and t.trainer_id is null
join public.exercises e on e.name = x.exercise_name;

insert into public.programme_templates (name, goal, days_per_week, description) values
  ('Bodybuilding - 3 Days (Push/Pull/Legs)', 'bodybuilding', 3, 'A classic push/pull/legs split for building muscle on three training days a week.'),
  ('Bodybuilding - 4 Days (Upper/Lower)', 'bodybuilding', 4, 'Two upper and two lower body sessions a week, hitting everything twice.'),
  ('Bodybuilding - 5 Days (Body Part Split)', 'bodybuilding', 5, 'A traditional body-part split - one muscle group per day, five days a week.'),
  ('Fat Loss - 3 Days (Full Body)', 'fat_loss', 3, 'Full body strength work three times a week to maximise calorie burn per session.'),
  ('Fat Loss - 4 Days (Upper/Lower + Conditioning)', 'fat_loss', 4, 'Two strength sessions and two conditioning sessions a week.'),
  ('General Fitness - 2 Days (Full Body)', 'general_fitness', 2, 'A simple, sustainable two-day full body routine.'),
  ('General Fitness - 3 Days (Full Body)', 'general_fitness', 3, 'A well-rounded three-day full body routine.'),
  ('Strength - 4 Days (Upper/Lower)', 'strength', 4, 'Low-rep, compound-lift focused upper/lower split for building strength.')
;

insert into public.programme_template_days (programme_template_id, day_of_week, workout_template_id)
select pt.id, x.day_of_week::public.day_of_week, wt.id
from (values
  ('Bodybuilding - 3 Days (Push/Pull/Legs)', 'mon', 'Push Day (Bodybuilding)'),
  ('Bodybuilding - 3 Days (Push/Pull/Legs)', 'wed', 'Pull Day (Bodybuilding)'),
  ('Bodybuilding - 3 Days (Push/Pull/Legs)', 'fri', 'Legs Day (Bodybuilding)'),

  ('Bodybuilding - 4 Days (Upper/Lower)', 'mon', 'Upper Body A (Bodybuilding)'),
  ('Bodybuilding - 4 Days (Upper/Lower)', 'tue', 'Lower Body A (Bodybuilding)'),
  ('Bodybuilding - 4 Days (Upper/Lower)', 'thu', 'Upper Body B (Bodybuilding)'),
  ('Bodybuilding - 4 Days (Upper/Lower)', 'fri', 'Lower Body B (Bodybuilding)'),

  ('Bodybuilding - 5 Days (Body Part Split)', 'mon', 'Chest Day (Bodybuilding)'),
  ('Bodybuilding - 5 Days (Body Part Split)', 'tue', 'Back Day (Bodybuilding)'),
  ('Bodybuilding - 5 Days (Body Part Split)', 'wed', 'Shoulders Day (Bodybuilding)'),
  ('Bodybuilding - 5 Days (Body Part Split)', 'thu', 'Legs Day (Bro Split)'),
  ('Bodybuilding - 5 Days (Body Part Split)', 'fri', 'Arms Day (Bodybuilding)'),

  ('Fat Loss - 3 Days (Full Body)', 'mon', 'Full Body A (Fat Loss)'),
  ('Fat Loss - 3 Days (Full Body)', 'wed', 'Full Body B (Fat Loss)'),
  ('Fat Loss - 3 Days (Full Body)', 'fri', 'Full Body A (Fat Loss)'),

  ('Fat Loss - 4 Days (Upper/Lower + Conditioning)', 'mon', 'Upper Body (Fat Loss)'),
  ('Fat Loss - 4 Days (Upper/Lower + Conditioning)', 'tue', 'Conditioning A (Fat Loss)'),
  ('Fat Loss - 4 Days (Upper/Lower + Conditioning)', 'thu', 'Lower Body (Fat Loss)'),
  ('Fat Loss - 4 Days (Upper/Lower + Conditioning)', 'fri', 'Conditioning B (Fat Loss)'),

  ('General Fitness - 2 Days (Full Body)', 'tue', 'Full Body A (General Fitness)'),
  ('General Fitness - 2 Days (Full Body)', 'fri', 'Full Body B (General Fitness)'),

  ('General Fitness - 3 Days (Full Body)', 'mon', 'Full Body A (General Fitness)'),
  ('General Fitness - 3 Days (Full Body)', 'wed', 'Full Body B (General Fitness)'),
  ('General Fitness - 3 Days (Full Body)', 'fri', 'Full Body C (General Fitness)'),

  ('Strength - 4 Days (Upper/Lower)', 'mon', 'Upper Body (Strength)'),
  ('Strength - 4 Days (Upper/Lower)', 'tue', 'Lower Body (Strength)'),
  ('Strength - 4 Days (Upper/Lower)', 'thu', 'Upper Body (Strength)'),
  ('Strength - 4 Days (Upper/Lower)', 'fri', 'Lower Body (Strength)')
) as x(programme_template_name, day_of_week, workout_template_name)
join public.programme_templates pt on pt.name = x.programme_template_name
join public.workout_templates wt on wt.name = x.workout_template_name and wt.trainer_id is null;
