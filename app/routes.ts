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
  route("admin", "routes/admin.tsx", [
    index("routes/admin._index.tsx"),
    route("products", "routes/admin.products.tsx"),
    route("skus", "routes/admin.skus.tsx"),
    route("breeds", "routes/admin.breeds.tsx"),
    route("imports", "routes/admin.imports.tsx"),
  ]),
] satisfies RouteConfig;
