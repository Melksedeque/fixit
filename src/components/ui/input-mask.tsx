'use client'

import * as React from 'react'
import { Input, InputProps } from '@/components/ui/input'
import VMasker from 'vanilla-masker'

interface InputMaskProps extends Omit<InputProps, 'onChange'> {
  mask: 'cpf' | 'cnpj' | 'phone' | 'cep' | 'money' | 'date'
  onChange?: (value: string) => void
}

const InputMask = React.forwardRef<HTMLInputElement, InputMaskProps>(
  ({ mask, onChange, ...props }, ref) => {
    const handleInput = (event: React.FormEvent<HTMLInputElement>) => {
      const input = event.currentTarget
      let value = input.value

      switch (mask) {
        case 'cpf':
          value = VMasker.toPattern(value, '999.999.999-99')
          break
        case 'cnpj':
          value = VMasker.toPattern(value, '99.999.999/9999-99')
          break
        case 'phone':
          value = VMasker.toPattern(value, '(99) 99999-9999')
          break
        case 'cep':
          value = VMasker.toPattern(value, '99999-999')
          break
        case 'money':
          value = VMasker.toMoney(value, {
            precision: 2,
            separator: ',',
            delimiter: '.',
            unit: 'R$',
            suffixUnit: '',
          })
          break
        case 'date':
          value = VMasker.toPattern(value, '99/99/9999')
          break
      }

      input.value = value
      if (onChange) {
        onChange(value)
      }
    }

    return <Input {...props} onInput={handleInput} ref={ref} />
  }
)
InputMask.displayName = 'InputMask'

export { InputMask }
