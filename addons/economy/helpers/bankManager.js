const BANKS = {
    apex_financial: {
        id: 'apex_financial',
        name: 'Apex Financial',
        emoji: '🏦',
        description: 'Bonus penghasilan aktif untuk para pekerja keras.',

        incomeBonusPercent: 10,
        interestRatePercent: 1,
        transferFeePercent: 5,
        withdrawFeePercent: 1,
        robSuccessBonusPercent: 0,
        robPenaltyMultiplier: 1,
        maxBalance: 1_000_000_000,
    },

    titan_holdings: {
        id: 'titan_holdings',
        name: 'Titan Holdings',
        emoji: '🏛️',
        description: 'Maksimalkan keuntungan pasif dengan bunga tertinggi.',

        incomeBonusPercent: 0,
        interestRatePercent: 5,
        transferFeePercent: 3,
        withdrawFeePercent: 2,
        robSuccessBonusPercent: 0,
        robPenaltyMultiplier: 1,
        maxBalance: 10_000_000_000,
    },

    zenith_commerce: {
        id: 'zenith_commerce',
        name: 'Zenith Commerce',
        emoji: '🌐',
        description: 'Transaksi tanpa batas dengan biaya transfer terendah.',

        incomeBonusPercent: 0,
        interestRatePercent: 2,
        transferFeePercent: 0,
        withdrawFeePercent: 0,
        robSuccessBonusPercent: 0,
        robPenaltyMultiplier: 1,
        maxBalance: 500_000_000,
    },

    crimson_syndicate: {
        id: 'crimson_syndicate',
        name: 'Crimson Syndicate',
        emoji: '🗡️',
        description: 'Keberuntungan berpihak pada yang berani. Bonus dari aktivitas ilegal.',

        incomeBonusPercent: -5,
        interestRatePercent: 0,
        transferFeePercent: 10,
        withdrawFeePercent: 0,
        robSuccessBonusPercent: 15,
        robPenaltyMultiplier: 2,
        maxBalance: Infinity,
    },

    solara_mutual: {
        id: 'solara_mutual',
        name: 'Solara Mutual',
        emoji: '☀️',
        description: 'Pilihan aman untuk memulai perjalanan ekonomimu.',

        incomeBonusPercent: 2,
        interestRatePercent: 2,
        transferFeePercent: 2,
        withdrawFeePercent: 1,
        robSuccessBonusPercent: -10,
        robPenaltyMultiplier: 1,
        maxBalance: 750_000_000,
    },
};

class BankManager {
    static getBank(bankId) {
        return BANKS[bankId] || BANKS['solara_mutual'];
    }
    static getAllBanks() {
        return Object.values(BANKS);
    }
}

module.exports = BankManager;
