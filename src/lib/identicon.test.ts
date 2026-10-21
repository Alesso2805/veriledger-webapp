import { describe, expect, it } from 'vitest';
import { addressCube, partialCube } from './identicon';

describe('addressCube', () => {
  it('colours the faces from the first three bytes, with the sides shaded', () => {
    // 0x46 % 8 = 6, 0x55 % 8 = 5, 0xec % 8 = 4
    expect(addressCube('4655ec4f0d2b7e91c5a3f86e2d40b1c97a5e3f28d61b0c4e9f7a28d5c3e1a19d')).toEqual({
      top: '#6FD3D8',
      left: '#857e3b',
      right: '#8975bf',
    });
  });

  it('colours the faces of an address being typed as its bytes arrive', () => {
    const address = '4655ec4f0d2b7e91c5a3f86e2d40b1c97a5e3f28d61b0c4e9f7a28d5c3e1a19d';

    expect(partialCube('')).toEqual({ top: null, left: null, right: null });
    expect(partialCube('465')).toEqual({ top: '#6FD3D8', left: null, right: null });
    expect(partialCube('4655ec')).toEqual(addressCube(address));
    expect(partialCube('zz55')).toEqual({ top: null, left: '#857e3b', right: null });
  });

  it('gives the same address the same cube, and another address another cube', () => {
    const address = 'd75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a';

    expect(addressCube(address)).toEqual(addressCube(address));
    expect(addressCube(address)).not.toEqual(addressCube('3d4017c3e843895a92b70aa74d1b7ebc9c982ccf2ec4968cc0cd55f12af4660c'));
  });
});
