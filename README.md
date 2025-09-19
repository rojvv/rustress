# rustress

A pure JavaScript inference-based stress marker for Russian based on the prior
works [StressRNN](https://github.com/dbklim/StressRNN) and
[russtress](https://github.com/MashaPo/russtress).

## Installation

### Deno

```shell
deno add jsr:@roj/rustress
```

### pnpm

```shell
pnpm add jsr:@roj/rustress
```

### Yarn

```shell
yarn add jsr:@roj/rustress
```

### npm

```shell
npx jsr i @roj/rustress
```

## Usage

```ts
import { markStresses } from "@roj/rustress";

const text = await markStresses("Проставь, пожалуйста, ударения");
console.log(text);
```

## API

Currently, only the method mentioned above is exported. The full documentation
is available [here](https://jsr.io/@roj/rustress/doc).
