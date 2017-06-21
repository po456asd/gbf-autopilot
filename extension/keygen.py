from OpenSSL import crypto
from base64 import b64encode
import json

key = crypto.PKey()
key.generate_key(crypto.TYPE_RSA, 2048)
dumped = crypto.dump_privatekey(crypto.FILETYPE_ASN1, key)
encoded = b64encode(dumped)

manifest = None
with open('manifest.json') as f:
    manifest = json.load(f)

manifest['key'] = encoded.decode('utf-8')
with open('manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
