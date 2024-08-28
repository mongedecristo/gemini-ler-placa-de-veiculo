import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FileConversionService {

  constructor() {
  }

  async convertToBase64(imageUrl: any): Promise<string> {
    var res = await fetch(imageUrl);
    var blob = await res.blob();

    return new Promise((resolve, reject) => {
      console.log("Entrou no service");
      var reader  = new FileReader();
      reader.onloadend = () => {
        console.log(reader);
        resolve(reader.result as string);
      }
      reader.onerror = (error) => {
        console.log("Erro no service: %s", error)
        return reject(this);
      };
      reader.readAsDataURL(blob);
    })
  }
}
