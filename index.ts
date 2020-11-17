type Func<T, TResult> = (arg: T) => TResult;
type Action<T> = (arg: T) => void;
declare const Type: FunctionConstructor;
declare interface Type<T> extends Function {
  new(...args: any[]): T;
}

class MemberConfigurationExpression<TSource, TMember> {
  public expressions: Func<TSource, TMember>[] = [];

  MapFrom(mapExpression: Func<TSource, TMember>): void {
    this.expressions.push(mapExpression);
  }
}

class MappingExpression<TSource, TDestination> {
  private _memberConfigurations: [keyof TDestination, MemberConfigurationExpression<TSource, any>][] = [];

  constructor(private source: Type<TSource> | TSource, private destination: Type<TDestination>) { }

  GetMembers() {
    return this._memberConfigurations;
  }

  ForMember<TMember>(destinationMember: keyof TDestination, memberOptions: Action<MemberConfigurationExpression<TSource, TMember>>): MappingExpression<TSource, TDestination> {
    const memberConfigurationExpression = new MemberConfigurationExpression<TSource, TMember>();

    memberOptions(memberConfigurationExpression);
    this._memberConfigurations.push([destinationMember, memberConfigurationExpression]);
    return this;
  }
}

class MapperConfigurationExpression {
  private _maps = new Map<string, Map<string, MappingExpression<any, any>>>();

  CreateMap<TSource, TDestination>(source: Type<TSource> | TSource, destination: Type<TDestination>): MappingExpression<TSource, TDestination> {
    const [sourceType, destinationType] = this.GetTypes(source, destination);

    const returnValue = new MappingExpression(source, destination);

    let sourceMap = this._maps.get(sourceType) ?? new Map<string, MappingExpression<unknown, unknown>>();
    if (sourceMap.size == 0) {
      this._maps.set(sourceType, sourceMap);
    }

    let destinationMap = sourceMap.get(destinationType);
    if (!destinationMap) {
      sourceMap.set(destinationType, returnValue);
    }
    return returnValue;
  }

  GetMapperExpression<TSource, TDestination>(source: Type<TSource> | TSource, destination: Type<TDestination>): MappingExpression<TSource, TDestination> | undefined {
    const [sourceType, destinationType] = this.GetTypes(source, destination);

    return this._maps.get(sourceType)?.get(destinationType);
  }

  private GetTypes<TSource, TDestination>(source: Type<TSource> | TSource, destination: Type<TDestination>): [string, string] {
    const sourceType = (typeof source === 'function') ? source.name : typeof source;
    const destinationType = (typeof destination === 'function') ? destination.name : typeof destination;

    return [sourceType, destinationType];
  }
}

class AutoMapper {
  static config = new MapperConfigurationExpression();

  static Initialize(action: (config: MapperConfigurationExpression) => void): void {
    action(this.config);
  }

  static Map<TSource, TDestination>(source: TSource, destination: Type<TDestination>): TDestination {
    const instance = new destination();

    const mapper = this.config.GetMapperExpression(source, destination);
    const members = mapper?.GetMembers();

    if (members) {
      for (const member of members) {
        const [destinationProperty, sourceExpression] = member;

        let value;
        for (const expression of sourceExpression.expressions) {
          value = expression(source);
        }
        Object.defineProperty(instance, destinationProperty, {
          value
        });
      }
    }

    return instance;
  }
}


// -------------------------------------------------------------------------------------------------------
interface ISituacao {
  Ignicao: boolean;
  SituacaoEquipamento: number;
  Texto?: any;
  Entrada1: boolean;
  Entrada2: boolean;
  Entrada3: boolean;
  Entrada4: boolean;
  Entrada5: boolean;
  Entrada6: boolean;
  Entrada7: boolean;
  Entrada8: boolean;
}

interface IRastreador {
  Id: number;
  IdVeiculo: number;
  NumeroSerial: string;
  IdInstalacaoTipo: number;
  IdEquipamentoTipo: number;
  Situacao: ISituacao;
  IdPosicao: number;
}

interface IPosicao {
  Id: number;
  IdEvento: number;
  EventoDatahora: Date;
  Rastreador: IRastreador;
}

// -------------------------------------------------------------------------------------------------------
class Rastreador implements IRastreador {
  Id!: number;
  IdVeiculo!: number;
  NumeroSerial!: string;
  IdInstalacaoTipo!: number;
  IdEquipamentoTipo!: number;
  IdPosicao!: number;
  Situacao!: ISituacao;

  static AutoMapper(config: MapperConfigurationExpression): void {
    config.CreateMap({} as IRastreador, Rastreador)
      .ForMember('Id', p => p.MapFrom(s => s.Id))
      .ForMember('IdVeiculo', p => p.MapFrom(s => s.IdVeiculo))
      .ForMember('Situacao', p => p.MapFrom(s => AutoMapper.Map(s.Situacao, Situacao)))
      ;
  }
}

class Situacao implements ISituacao {
  Ignicao!: boolean;
  SituacaoEquipamento!: number;
  Texto?: any;
  Entrada1!: boolean;
  Entrada2!: boolean;
  Entrada3!: boolean;
  Entrada4!: boolean;
  Entrada5!: boolean;
  Entrada6!: boolean;
  Entrada7!: boolean;
  Entrada8!: boolean;

  static AutoMapper(config: MapperConfigurationExpression): void {
      config.CreateMap({} as ISituacao, Situacao)
        .ForMember('Ignicao', p => p.MapFrom(s => s.Ignicao));
  }
}

class Posicao implements IPosicao {
  Id!: number;
  IdEvento!: number;
  EventoDatahora!: Date;
  Rastreador!: Rastreador;

  static AutoMapper(config: MapperConfigurationExpression): void {
    config.CreateMap({} as IPosicao, Posicao)
      .ForMember('Id', p => p.MapFrom(s => s.Id))
      .ForMember('IdEvento', p => p.MapFrom(s => s.IdEvento))
      .ForMember('EventoDatahora', p => p.MapFrom(s => new Date(s.EventoDatahora)))
      .ForMember('Rastreador', p => p.MapFrom(s => AutoMapper.Map(s.Rastreador, Rastreador)));
  }
}

// -------------------------------------------------------------------------------------------------------
class Program {
  static Main(): void {
    this.Setup();
    this.Initialize();
  }

  static Initialize(): void {
    const source = JSON.parse(`{"Id":1,"IdEvento":123,"EventoDatahora":"2020-11-17T14:09:48.889Z", "Rastreador": {"Id":12,"IdVeiculo":2951,"NumeroSerial":"863586039137157","IdInstalacaoTipo":16,"IdEquipamentoTipo":1,"Situacao":{"Ignicao":true,"SituacaoEquipamento":0,"Texto":null,"Entrada1":true,"Entrada2":true,"Entrada3":true,"Entrada4":true,"Entrada5":true,"Entrada6":true,"Entrada7":true,"Entrada8":true},"IdPosicao":876844308}}`);
    const destination = AutoMapper.Map(source, Posicao);
    console.log('destination:', destination);
  }

  static Setup(): void {
    AutoMapper.Initialize(config => {
      Posicao.AutoMapper(config);
      Rastreador.AutoMapper(config);
      Situacao.AutoMapper(config);
    });
  }
}

Program.Main();
