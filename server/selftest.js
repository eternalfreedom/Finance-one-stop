// Offline sanity checks for the parsers (no network): `npm run check`
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
process.env.DATA_DIR ||= path.join(os.tmpdir(), 'fos-selftest');
const { parseForm4 } = await import('./lib/insider.js');
const { parsePtrText } = await import('./lib/congress.js');
const { sicToSector } = await import('./lib/sec.js');
const { decodeEntities } = await import('./lib/net.js');

const f4 = parseForm4(`<ownershipDocument><issuer><issuerCik>1</issuerCik><issuerName>ACME CORP</issuerName><issuerTradingSymbol>acme</issuerTradingSymbol></issuer>
<reportingOwner><reportingOwnerId><rptOwnerName>DOE JANE</rptOwnerName></reportingOwnerId><reportingOwnerRelationship><isOfficer>1</isOfficer><officerTitle>Chief Executive Officer</officerTitle></reportingOwnerRelationship></reportingOwner>
<nonDerivativeTable><nonDerivativeTransaction><transactionDate><value>2026-10-01</value></transactionDate><transactionCoding><transactionCode>P</transactionCode></transactionCoding>
<transactionAmounts><transactionShares><value>1000</value></transactionShares><transactionPricePerShare><value>12.5</value></transactionPricePerShare><transactionAcquiredDisposedCode><value>A</value></transactionAcquiredDisposedCode></transactionAmounts></nonDerivativeTransaction></nonDerivativeTable></ownershipDocument>`);
assert.equal(f4.issuer.ticker, 'ACME');
assert.equal(f4.owner.role, 'CEO');
assert.equal(f4.txs[0].code, 'P');
assert.equal(f4.txs[0].shares * f4.txs[0].price, 12500);

const ptr = parsePtrText(`S          O : Trust One
Walt Disney Company (DIS) [ST]
S10/01/202610/28/2026$1,001 - $15,000
F      S     : New
Texas Instruments Incorporated -
Common Stock (TXN) [ST]
P09/17/202610/01/2026$15,001 -
$50,000
SPApple Inc. (AAPL) [ST]
P09/18/202610/01/2026$1,001 - $15,000`);
assert.equal(ptr.length, 3);
assert.equal(ptr[0].asset, 'Walt Disney Company');
assert.equal(ptr[0].type, 'SELL');
assert.equal(ptr[1].asset, 'Texas Instruments Incorporated - Common Stock');
assert.equal(ptr[1].amount, '$15,001 - $50,000');
assert.equal(ptr[2].owner, 'Spouse');
assert.equal(ptr[2].date, '2026-09-18');

assert.equal(sicToSector(3674), 'Technology');
assert.equal(sicToSector(6798), 'Real Estate');
assert.equal(sicToSector(2834), 'Healthcare');
assert.equal(decodeEntities('&amp;#x2018;Hi&#x2019; &amp; bye'), '‘Hi’ & bye');
console.log('selftest ok');
process.exit(0);
