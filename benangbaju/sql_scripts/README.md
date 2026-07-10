# Supabase SQL Scripts

This directory contains the initialization scripts for the Supabase PostgreSQL database.

## How to Initialize the Database

To set up the database from scratch (for a new developer or a fresh environment), you only need to run **one script**:

1. Open the Supabase SQL Editor in your dashboard.
2. Copy the contents of `00_init_database.sql` and execute it.

> **Note:** The `00_init_database.sql` file is a compilation of the sequential scripts (01 to 04) to make initialization easier. You do not need to run 01, 02, 03, and 04 individually unless you are debugging specific components.
