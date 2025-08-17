import { getAddress } from 'viem'

const address = '0xd47be5ca7c38b4beb6ffcb9b7da848de71ec8edb'
console.log('Checksummed address:', getAddress(address))
