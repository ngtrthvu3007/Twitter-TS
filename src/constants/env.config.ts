import argv from 'minimist'
const env = argv(process.argv.slice(2))
export const isProduction = env.live as Boolean
