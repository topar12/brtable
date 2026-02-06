import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("auth/callback", "routes/auth.callback.tsx"),
  route("onboarding", "routes/onboarding.tsx"),
  route("calculator", "routes/calculator.tsx"),
  route("products", "routes/products.tsx"),
  route("products/:id", "routes/products.$id.tsx"),
  route("compare", "routes/compare.tsx"),
  route("pets", "routes/pets.tsx"),
  route("pets/edit/:id", "routes/pets.edit.$id.tsx"),
  route("profile", "routes/profile.tsx"),
  route("menu", "routes/menu.tsx"),
  route("welcome", "routes/welcome.tsx"),
  route("tools/walk-timer", "routes/tools.walk-timer.tsx"),
  route("tools/pet-age", "routes/tools.pet-age.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("guide", "routes/guide.tsx"),

  // Community Routes
  route("community", "routes/community.tsx"),
  route("community/write", "routes/community.write.tsx"),
  route("community/post/:postId", "routes/community.post.$postId.tsx"),

  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("products", "routes/admin.products.tsx"),
    route("skus", "routes/admin.skus.tsx"),
    route("breeds", "routes/admin.breeds.tsx"),
    route("community", "routes/admin.community.tsx"),
    route("guides", "routes/admin.guides.tsx"),
    route("imports", "routes/admin.imports.tsx"),
    route("users", "routes/admin.users.tsx"),
    route("users/:userId", "routes/admin.users.$userId.tsx"),
    route("pets", "routes/admin.pets.tsx"),
  ]),
] satisfies RouteConfig;
