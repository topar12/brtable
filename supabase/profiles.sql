CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_name TEXT,
  species TEXT CHECK (species IN ('DOG', 'CAT')),
  breed_id TEXT,
  weight_kg NUMERIC(5,2),
  is_neutered BOOLEAN DEFAULT FALSE,
  activity_level INTEGER CHECK (activity_level BETWEEN 1 AND 5),
  allergies TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_species ON profiles(species);
CREATE INDEX IF NOT EXISTS idx_profiles_breed ON profiles(breed_id);

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
