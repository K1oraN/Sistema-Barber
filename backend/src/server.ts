import app from "./app.js";
import { env } from "./utils/env.js";

app.listen(env.PORT, () => {
  console.log(`Club do Rafa API running on port ${env.PORT}`);
});
