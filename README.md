## Intro

Bienvenidos al README del proyecto.

En base a la solicitud de optimización del aplicativo, decidí utilizar tecnologías que permitan manejar correctamente las limitadas consultas que se pueden realizar con el API Mock.

A continuación, procederé a dar los motivos por los cuales decidí implementar herramientas que me brindaron lograr, desde una primer instancia, el correcto uso del aplicativo, mejorando significativamente el tiempo de respuesta, el cual antes era un problema por su alta latencia.

**Bull - Administrar colas**: Luego de investigar sobre las colas de trabajo, decidí implementarlas con la tecnología Bull y evitar la saturación del sistema cuando el API Mock se colapsaba y no respondía correctamente.

**Redis - Administrar caché**: Elegí Redis para la administración del caché, porque provee un servicio de caché rápido y eficiente, reduciendo así la alta latencia que sufría el Micro servicio, al almacenar respuestas frecuentes y simplemente consultarlas. Esto permitió que aumente la velocidad de las respuestas, la consistencia del Micro servicio, y reduciendo la cantidad de peticiones (limitadas por X tiempo) del API Mock.

**Resultado**: Se redujo el tiempo de espera a 4s para las peticiones de datos no almacenados y ~350ms en datos almacenados. Con un máximo de ~1:10 minutos cuando se alcance el limite de peticiones

# IMPORTANTE

Se realizaron los siguientes cambios a la api mock para su correcto funcionamiento

### Control de peticiones

```js
let request_count = 0;

fastify.addHook('onRequest', function (request, reply, done) {
  request_count++;
  if (request_count > REQUESTS_PER_MINUTE) {
    reply.code(429);
    done(new Error('Too many requests'));
    return;
  }
  console.log('Available requests:', REQUESTS_PER_MINUTE - request_count);
  setTimeout(60 * 1000).then(() => {
    console.log('Available requests:', REQUESTS_PER_MINUTE - request_count);
    request_count--;
  });
  done();
});
```

> Se detecto un comportamiento inesperado donde al cumplirse el minuto unicamente sumaba 1 intento y no su totalidad.

```js
setInterval(() => {
  available_requests = REQUESTS_PER_MINUTE;
  console.log('Request limit reset. Available requests:', available_requests);
}, 60 * 1000);

fastify.addHook('onRequest', function (_request, reply, done) {
  if (available_requests <= 0) {
    reply.code(429);
    done(new Error('Too many requests'));
    return;
  }

  available_requests--;
  console.log('Available requests:', available_requests);

  done();
});
```

> Se aplico un codigo mas sencillo que asegura el correcto funcionamiento del mismo

### Validacion de datos en EP de canchas por id

```js
fastify.get(
  '/clubs/:clubId/courts/:courtId',
  //...resto del codigo
  async (request, reply) => {
    const court = data.getCourt(request.params.clubId, request.params.courtId);
    if (!court.length) {
      return reply.code(404).send();
    }
    return omit('available')(court);
  },
);
```

> Se detecto la validacion por "length" a un objeto resultando en todo momento una respuesta erronea

```js
fastify.get(
  '/clubs/:clubId/courts/:courtId',
  //...resto del codigo
  async (request, reply) => {
    const court = data.getCourt(request.params.clubId, request.params.courtId);
    if (!court) {
      return reply.code(404).send();
    }
    return omit('available')(court);
  },
);
```

> Se agrego una validacion de tipo falsey resultando en un comportamiento correcto

## Como iniciar el proyecto

- Descargar redis para Windows desde [Github](https://github.com/microsoftarchive/redis/releases)
- Ejecutar en PowerShell

```
cd "C:\Program Files\Redis"
```

```
.\redis-server.exe --port 6380
```

- Iniciar API y API mock

## Documentación

Debajo, tendrán la documentación consultada para realizar la solución planteada, y las tecnologías que se decidieron utilizar.

## NestJS

- [NestJS Doc](https://docs.nestjs.com/providers#services)
- [NestJS GitHub](https://github.com/nestjs/nest)
- [NestJS Medium - Module/Services](https://medium.com/@prajapatijinesh3/nestjs-module-services-860e12689c1b)

## Bull (Queue administrator)

- [Bull Doc](https://docs.nestjs.com/techniques/queues)
- [Bull - Queuing Jobs](https://dev.to/railsstudent/queuing-jobs-in-nestjs-using-nestjsbullmq-package-55c1)

## Redis (Cache managment & job queue/enqueue implementation)

- [Redis Doc](https://docs.nestjs.com/microservices/redis)
- [Redis - Using Redis Client in NestJS](https://medium.com/@akintobiidris/using-redis-client-in-nestjs-3fe80eb91a49)

## Hexagonal Architecture (NestJs oriented)

- [Guide - Step 1](https://nullpointer-excelsior.github.io/posts/implementando-hexagonal-con-nestjs-part1/)
- [Guide - Step 2](https://nullpointer-excelsior.github.io/posts/implementando-hexagonal-con-nestjs-part2/)

## Diagrama hexagonal de la aplicación

![Arquitectura](https://i.postimg.cc/hvpnvXjH/hexagon-svgrepo-com-1.png)

## Diagrama de manejo de peticiones

![Peticiones](https://i.postimg.cc/jdxDQytp/atc.webp)

## Puntos a mejorar

### 1. Testing

Se realizaron testeos sobre los servicios de eventos, sin embargo, fueron omitidos por su complejidad los testeos en los handlers de busquedas

### 2. Docker
La creacion de imagenes en docker no pudo ser testeada debido a un error de permisos desconocido, independientemente de la gran variedad de soluciones aplicadas en los archivos de configuracion
