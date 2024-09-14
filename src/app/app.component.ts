import { AfterViewInit, Component, Input, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { BaseParams, GenerationConfig, GenerativeContentBlob, GenerativeModel, GoogleGenerativeAI, HarmBlockThreshold, HarmCategory, InlineDataPart, Part } from "@google/generative-ai";
import { FileConversionService } from './file-conversion.service';
import { environment } from '../environments/environment';
import { EventEmitter } from 'node:stream';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [FormsModule]
})
export class AppComponent implements AfterViewInit{

  @Input()
  public imagem: string = "";
  public title = 'ia-gemini-jason';
  public genAI: GoogleGenerativeAI;
  public model!: GenerativeModel;
  public resposta!: string;

  constructor(private sanitizer: DomSanitizer, public fileConversionService: FileConversionService) {
    this.genAI = new GoogleGenerativeAI(environment.googleAiApiKey);
  }

  ngAfterViewInit(): void {

  }

  /**
   * Localiza se há Mime Type suportado pelo Google Gemini
   */
  public achaMimeType(txt: string): string {
    const mimeTypes: string[] = [
      "image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"
    ];
    const match = txt.match(/^data:(image\/\w+);base64,/i);
    let retorno: string = "";
    if (match && match.length > 1 && mimeTypes.includes(match[1])) {
      retorno += mimeTypes.find((mt) => mt == match[1]);
    }
    return retorno;
  }

  // Converts a File object to a GoogleGenerativeAI.Part object.
  fileToGenerativePart(file: string): Promise<GenerativeContentBlob> {
    let inlineData = { data: "", mimeType: ""} as GenerativeContentBlob;
    this.fileConversionService.convertToBase64(file)
      .then((img: string) => {
        inlineData.mimeType = this.achaMimeType(img);
        inlineData.data = img.slice(inlineData.mimeType.length + 13);
        return inlineData;
      }, (reason) => {
        let erro = `Não converteu a imagem: ${reason}`;
        console.error(erro);
        return erro;
      });
    return new Promise(() => null);
  }

  async testaGeminiLendoImagens() {
    try {
      if (!this.imagem) {
        console.error('Nenhuma imagem detectada');
        return
      }
      let prompt: Array<string | Part> = [
        { inlineData: {
          mimeType: this.achaMimeType(this.imagem),
          data: this.imagem.split(',')[1]
        }
        },
        'Qual a placa deste veículo?'
      ];

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      this.resposta = response.text();
    } catch (error) {
      console.error('Error converting file to Base64', error);
    }
  }

  async run() {
    const generationConfig: BaseParams | GenerationConfig = {
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE
        }
      ],
      temperature: 0.9,
      topP: 1,
      topK: 1,
      maxOutputTokens: 100 // limit output
    };
    // The Gemini 1.5 models are versatile and work with both
    // text-only and multimodal prompts
    this.model = this.genAI.getGenerativeModel(
      { model: "gemini-1.5-flash", ...generationConfig }
    );
    this.testaGeminiLendoImagens();
  }

  capturaImagem(event: Event) {
    const tgt = event.target;
    if (!(tgt instanceof HTMLInputElement)) return;
    const reader = new FileReader();
    if ((tgt as HTMLInputElement).files) {
      const [arquivo] = tgt.files as FileList;
      reader.onload = (e:any) => {
        this.imagem = e.target.result;
        this.run();
      }
      reader.readAsDataURL(arquivo);
    } else {
      console.error("Erro ao capturar imagem.");
    }
  }

}
