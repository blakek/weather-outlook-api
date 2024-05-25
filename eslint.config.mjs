import globals from "globals";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  {
    languageOptions: { globals: globals.browser },
  },
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
      },
    },

    rules: {
      camelcase: [
        "error",
        {
          // Allows UNSAFE functions in React to be used and flagged by a
          // different rule.
          allow: ["^UNSAFE_"],
          ignoreDestructuring: true,
          ignoreImports: true,
          properties: "never",
        },
      ],
      "no-debugger": ["warn"],
      "no-extra-label": ["error"],
      "no-implicit-coercion": ["warn"],
      "no-restricted-syntax": ["error", "WithStatement"],
      "no-sparse-arrays": ["off"],
      "prefer-const": ["off"],
      radix: ["error", "as-needed"],
      "require-yield": ["error"],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          args: "none",
          caughtErrors: "none",
          ignoreRestSiblings: true,
          vars: "all",
        },
      ],
      "no-use-before-define": "off",
      "@typescript-eslint/no-use-before-define": [
        "error",
        {
          classes: false,
          enums: false,
          functions: false,
          ignoreTypeReferences: true,
          typedefs: false,
          variables: false,
        },
      ],

      "prefer-const": "off",
      "no-void": ["error", { allowAsStatement: true }],

      "@typescript-eslint/ban-ts-comment": ["warn"],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "allow" },
      ],
      "@typescript-eslint/no-base-to-string": "warn",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": [
        "error",
        { allowSingleExtends: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-extra-non-null-assertion": "error",
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowWithDecorator: true },
      ],
      "@typescript-eslint/no-implied-eval": "error",
      "@typescript-eslint/no-inferrable-types": [
        "error",
        {
          ignoreParameters: true,
        },
      ],
      "@typescript-eslint/no-invalid-void-type": "error",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "error",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "@typescript-eslint/no-this-alias": [
        "error",
        { allowDestructuring: true },
      ],
      "@typescript-eslint/no-unnecessary-boolean-literal-compare": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/prefer-as-const": "error",
      "@typescript-eslint/prefer-function-type": "error",
      "@typescript-eslint/prefer-includes": "warn",
      "@typescript-eslint/prefer-namespace-keyword": "error",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/prefer-ts-expect-error": "warn",
      "@typescript-eslint/require-array-sort-compare": [
        "error",
        { ignoreStringArrays: true },
      ],
      "@typescript-eslint/restrict-template-expressions": [
        "warn",
        { allowAny: true, allowBoolean: true, allowNumber: true },
      ],
      "@typescript-eslint/return-await": ["off"],
      "@typescript-eslint/triple-slash-reference": "error",
    },
  },
  {
    ignores: ["node_modules/", "dist/", "api/"],
  },
];
