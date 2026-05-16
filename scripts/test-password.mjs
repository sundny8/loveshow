import { hash } from 'bcryptjs';

const password = '*Asdf9527';
const hashed = await hash(password, 10);

console.log('Password:', password);
console.log('Hashed:', hashed);

// Test comparison
import { compare } from 'bcryptjs';
const isValid = await compare(password, hashed);
console.log('Validation test:', isValid);
