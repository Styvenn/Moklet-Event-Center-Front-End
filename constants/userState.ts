// constants/userState.ts

class UserState {
  private nama: string = 'Dimas Saputra'; // Default fallback matching UI mockup

  setNama(nama: string) {
    this.nama = nama;
  }

  getNama() {
    return this.nama;
  }
}

export const userState = new UserState();
