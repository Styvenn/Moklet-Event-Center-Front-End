// constants/userState.ts

class UserState {
  private nama: string = 'Dimas Saputra';
  private email: string = 'dimas@student.moklet.sch.id';
  private isLoggedIn: boolean = false;

  setNama(nama: string) {
    if (nama && nama.trim()) {
      this.nama = nama.trim();
    }
  }

  getNama(): string {
    return this.nama;
  }

  setEmail(email: string) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();
    this.email = cleanEmail;

    // Generate readable default name from email if name is default or uncustomized
    if (cleanEmail.includes('@')) {
      const username = cleanEmail.split('@')[0];
      const formattedName = username
        .split(/[._-]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
      if (formattedName) {
        this.nama = formattedName;
      }
    }
  }

  getEmail(): string {
    return this.email;
  }

  setLoggedIn(status: boolean) {
    this.isLoggedIn = status;
  }

  getLoggedIn(): boolean {
    return this.isLoggedIn;
  }
}

export const userState = new UserState();
