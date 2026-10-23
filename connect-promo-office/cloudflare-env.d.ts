declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    OFFICE_RUNNER_TOKEN?: string;
  }
}
