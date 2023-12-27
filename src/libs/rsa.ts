import { KeyExportOptions, generateKeyPairSync, randomBytes } from 'crypto'
import { createWriteStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export class RSAKey {
  private _genKeyFile(keyName: string, dir: string): void {
    const { privateKey, publicKey } = generateKeyPairSync('rsa', {
      modulusLength: 2048
    })
    const options: KeyExportOptions<'pem'> = {
      format: 'pem',
      type: 'pkcs1'
    }
    // get keys
    const PRIK = privateKey.export(options) as string
    const PUBK = publicKey.export(options) as string
    // save public key
    const public_key = createWriteStream(join(dir, `./${keyName}.key.pub`))
    public_key.write(PUBK)
    public_key.end()
    // save private key
    const private_key = createWriteStream(join(dir, `./${keyName}.key`))
    private_key.write(PRIK)
    private_key.end()
  }

  public getTokenKey() {
    randomBytes(56, (_err, buffer) => {
      var token = buffer.toString('hex')
      const public_key = createWriteStream('.env', { flags: 'a' })
      public_key.write(`\nJWT_SECRET=${token}\n`)
      public_key.end()
    })
  }

  public generate(): void {
    const KEY_DIR = './keys'
    if (!existsSync(join(KEY_DIR))) {
      mkdirSync(KEY_DIR)
      this._genKeyFile('access', KEY_DIR)
      this._genKeyFile('refresh', KEY_DIR)
    }
  }
}
