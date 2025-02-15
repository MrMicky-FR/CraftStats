import eslint from '@eslint/js'
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.strict,
  eslintPluginPrettier,
  {
    rules: {
      '@typescript-eslint/no-dynamic-delete': 'off',
    },
  },
)
