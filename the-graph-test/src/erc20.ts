import { 
    Transfer as TransferEvent
} from "../generated/ERC20/ERC20"

import {
    Transfer, User
} from '../generated/schema'

export function handleTansfer(event: TransferEvent): void {
    let transfer = new Transfer(event.transaction.hash.toHexString())
    transfer.creator = event.params.from.toHexString()
    transfer.receiver = event.params.to
    transfer.tokenAmount = event.params.amount
    transfer.blockNumber = event.block.number
    transfer.blockTimestamp = event.block.timestamp
    transfer.gasLimit = event.transaction.gasLimit
    transfer.gasPrice = event.transaction.gasPrice
    transfer.save()

    let user = User.load(event.params.from.toHexString())
    if (!user) {
        user = new User(event.params.from.toHexString())
        user.save()
    }
}