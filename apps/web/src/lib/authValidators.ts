// Re-export depuis @taxilink/core. Le code de verite vit dans
// packages/core/src/validators/authValidators.ts (cross-platform).
export {
  PHONE_REGEX,
  isValidPhone,
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidIban,
  formatIban,
} from '@taxilink/core'
