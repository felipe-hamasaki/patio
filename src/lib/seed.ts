import { type State, type Order, type Item, stateSchema } from './domain';
export function seed(): State {
  const now = new Date();
  const at = (hours: number) => new Date(now.getTime() + hours * 3_600_000).toISOString();
  const names = [
    'Marina Costa',
    'Lucas Oliveira',
    'Beatriz Lima',
    'Pedro Santos',
    'Ana Martins',
    'Diego Alves',
  ];
  const models = [
    'Honda Fit',
    'Volkswagen Polo',
    'Fiat Argo',
    'Renault Sandero',
    'Toyota Etios',
    'Chevrolet Onix',
  ];
  const titles = [
    'Revisão do sistema de freios',
    'Troca de óleo e filtros',
    'Ruído na suspensão dianteira',
    'Troca de bateria',
    'Alinhamento e balanceamento',
    'Revisão do arrefecimento',
  ];
  const stages: Order['stage'][] = [
    'approval',
    'execution',
    'diagnosis',
    'approval',
    'ready',
    'execution',
  ];
  const parts: [string, number, 'part' | 'labor'][][] = [
    [
      ['Jogo de pastilhas de freio', 28000, 'part'],
      ['Fluido de freio DOT 4', 6500, 'part'],
      ['Revisão e instalação', 18000, 'labor'],
    ],
    [
      ['Óleo sintético e filtro', 29000, 'part'],
      ['Troca e verificação', 9000, 'labor'],
    ],
    [],
    [
      ['Bateria 60 Ah', 47000, 'part'],
      ['Instalação e teste', 6000, 'labor'],
    ],
    [
      ['Alinhamento', 12000, 'labor'],
      ['Balanceamento', 8000, 'labor'],
    ],
    [
      ['Mangueira e aditivo', 19500, 'part'],
      ['Revisão do arrefecimento', 16000, 'labor'],
    ],
  ];
  return stateSchema.parse({
    schema: 1,
    revision: 0,
    draft: null,
    customers: names.map((name, i) => ({
      id: `c${i}`,
      name,
      contact: `cliente${i + 1}@example.com`,
    })),
    vehicles: models.map((model, i) => ({
      id: `v${i}`,
      customerId: `c${i}`,
      model,
      plate: `DEM${i}A2${i}`,
      year: [2017, 2020, 2022, 2019, 2018, 2021][i],
    })),
    orders: names.map((_, i): Order => {
      const items: Item[] = parts[i].map(([name, price, kind], j) => ({
        id: `item${i}-${j}`,
        name,
        price,
        kind,
        quantity: 100,
        discount: 0,
      }));
      const approved = ['execution', 'ready'].includes(stages[i]);
      return {
        id: String(1042 + i),
        number: 1042 + i,
        customerId: `c${i}`,
        vehicleId: `v${i}`,
        title: titles[i],
        report: [
          'Cliente relata ruído ao frear e pede uma revisão antes de viajar.',
          'Revisão periódica. Conferir níveis e substituir o filtro de óleo.',
          'Ruído ao passar por lombadas. Avaliar suspensão dianteira.',
          'Veículo com dificuldade na partida pela manhã.',
          'Volante desalinhado em linha reta. Conferir pneus e geometria.',
          'Cliente percebeu perda de líquido e aquecimento.',
        ][i],
        mileage: [68400, 42150, 23800, 89200, 71500, 36400][i],
        tech: i % 2 ? 'Bruno' : 'Rafael',
        due: at([-2, 2, 20, 4, 1, 24][i]),
        createdAt: at(-24),
        stage: stages[i],
        checks: i === 2 ? [true, true, false, true] : [true, true, true, true],
        photos: ['front'],
        quotes: items.length
          ? [
              {
                version: 1,
                items,
                status: approved ? 'approved' : 'pending',
                accepted: approved ? items.map((x) => x.id) : [],
                createdAt: at(-20),
                ...(approved ? { decidedAt: at(-18) } : {}),
              },
            ]
          : [],
        completed: stages[i] === 'ready' ? items.map((x) => x.id) : i === 1 ? [items[0].id] : [],
        finalChecks: stages[i] === 'ready' ? [true, true] : [false, false],
        blocked: i === 5 ? 'Mangueira superior • previsão amanhã às 9h' : '',
        payments: i === 4 ? [{ id: 'payment-seed', amount: 10000, method: 'Pix', at: at(-1) }] : [],
        deliveryReason: '',
        events: [
          {
            id: `event-${i}`,
            at: at(-24),
            description: 'Veículo recebido. Checklist de entrada registrado.',
          },
          ...(items.length
            ? [
                {
                  id: `quote-event-${i}`,
                  at: at(-20),
                  description: approved
                    ? 'Orçamento v1 aprovado na simulação.'
                    : 'Orçamento v1 aguardando aprovação simulada.',
                },
              ]
            : []),
        ],
      };
    }),
  });
}
