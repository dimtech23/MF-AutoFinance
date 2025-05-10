module.exports = {
    extends: ["react-app"],
    rules: {
      "no-unused-vars": "warn", // Downgrade from error to warning
      "react-hooks/exhaustive-deps": "warn", // Downgrade from error to warning
      "jsx-a11y/anchor-is-valid": "warn", // Downgrade from error to warning
      "jsx-a11y/img-redundant-alt": "warn" // Downgrade from error to warning
    }
  };