import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"

@Entity_()
export class Transfer {
    constructor(props?: Partial<Transfer>) {
        Object.assign(this, props)
    }

    @PrimaryColumn_()
    id!: string

    @Index_()
    @Column_("text", {nullable: false})
    src!: string

    @Index_()
    @Column_("text", {nullable: false})
    dst!: string

    @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
    wad!: bigint
}
