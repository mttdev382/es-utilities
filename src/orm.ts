// @ts-ignore
import * as Firebird from "es-node-firebird";
import {Logger} from "./logger";
import {Database, Options, Transaction} from "node-firebird";


const quote = (value: string): string => {
    return "\"" + value + "\"";
};
const testConnection = (options: Options): Promise<any> => {
    const logger: Logger = new Logger(__filename);
    return new Promise((resolve): void => {
        Firebird.attach(options, (err: Error, db: Database): void => {
            if (err) {
                logger.error('La connessione con il DATABASE non è andata a buon fine.');
                db.detach();
                return resolve(false);
            }
            logger.info("DATABASE connesso.");
            db.detach();
            return resolve(true);
        })
    })
}

const query = (options: Options, query: string, parameters: any[] = []): Promise<any> => {
    return new Promise((resolve, reject): void => {
        Firebird.attach(options, (err: any, db: {
            query: (arg0: any, arg1: any[], arg2: (err: any, result: any) => void) => void; detach: () => void;
        }) => {
            if (err) {
                return reject(err);
            }
            db.query(query, parameters, (error: any, result: any) => {
                if (error) {
                    db.detach();
                    return reject(error);
                }
                db.detach();
                return resolve(result);
            });
        });
    });
}
const execute = (options: Options, query: string, parameters: any = []): Promise<any> => {
    return new Promise((resolve, reject): void => {
        Firebird.attach(options, (err: any, db: {
            execute: (arg0: any, arg1: any, arg2: (error: any, result: any) => void) => void; detach: () => void;
        }) => {
            if (err) {
                return reject(err);
            }

            db.execute(query, parameters, (error, result): void => {
                if (error) {
                    db.detach();
                    return reject(error);
                }
                db.detach();
                return resolve(result);
            });
        });
    });
}

const trimParam = (param: any): string => {
    if (typeof param === "string" || param instanceof String) {
        return param.trim();
    }
    return param;
}

const connect = (options: Options): Promise<any> => {
    return new Promise((resolve, reject): void => {
        Firebird.attach(options, function (err: any, db: any): void {
            if (err) return reject(err); else return resolve(db);
        });
    });
}

const startTransaction = (db: Database): Promise<any> => {
    return new Promise((resolve, reject): void => {
        db.transaction(Firebird.ISOLATION_READ_COMMITTED, function (err: any, transaction: any) {
            if (err) return reject(err); else return resolve(transaction);
        });
    });
}
const executeQueries = (transaction: Transaction, queries: string[], params: any[]) => {
    return queries.reduce((promiseChain: any, currentQuery: any, index: any) => {
        return promiseChain.then(() => new Promise((resolve, reject): void => {
            transaction.query(currentQuery, params[index], (err: any, result: any): void => {
                if (err) return reject(err); else return resolve(result);
            });
        }));
    }, Promise.resolve());
}

const commitTransaction = (transaction: Transaction): Promise<any> => {
    return new Promise((resolve, reject): void => {
        transaction.commit((err: any): void => {
            if (err) return reject(err); else return resolve('Transaction committed successfully.');
        });
    });
}

interface Orm {
    quote: (value: string) => string,
    testConnection: (options: Options) => Promise<any>,
    query: (options: Options, query: any, parameters?: any[]) => Promise<any>,
    execute: (options: Options, query: any, parameters?: any[]) => Promise<any>,
    trimParam: (param: any) => string,
    connect: (options: Options) => Promise<any>,
    startTransaction: (db: Database) => Promise<any>,
    executeQueries: (transaction: Transaction, queries: string[], params: any[]) => any,
    commitTransaction: (transaction: Transaction) => Promise<any>
}

export const Orm: Orm = {
    quote, testConnection, query, execute, trimParam, connect, startTransaction, executeQueries, commitTransaction
}


