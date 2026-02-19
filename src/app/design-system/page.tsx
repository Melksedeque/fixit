import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputMask } from '@/components/ui/input-mask'
import {
  Save,
  Trash2,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Edit,
} from 'lucide-react'

export default function DesignSystemPage() {
  return (
    <div className="p-8 space-y-12 max-w-5xl mx-auto">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Botões</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Default (Primary)</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="edit">Edit</Button>
        </div>

        <h3 className="text-xl font-semibold mt-8">Com Ícones</h3>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
          <Button variant="secondary">
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="success">
            <CheckCircle className="mr-2 h-4 w-4" /> Concluir
          </Button>
          <Button variant="warning">
            <AlertTriangle className="mr-2 h-4 w-4" /> Atenção
          </Button>
          <Button variant="edit">
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Inputs (Float Label)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="Nome Completo" type="text" />
          <Input label="E-mail" type="email" />
          <Input label="Senha" type="password" />
          <Input placeholder="Sem Label (Default)" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Inputs com Máscara</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputMask mask="cpf" label="CPF" placeholder="000.000.000-00" />
          <InputMask
            mask="cnpj"
            label="CNPJ"
            placeholder="00.000.000/0000-00"
          />
          <InputMask
            mask="phone"
            label="Telefone"
            placeholder="(00) 00000-0000"
          />
          <InputMask mask="cep" label="CEP" placeholder="00000-000" />
          <InputMask mask="money" label="Valor" placeholder="R$ 0,00" />
          <InputMask mask="date" label="Data" placeholder="00/00/0000" />
        </div>
      </section>
    </div>
  )
}
