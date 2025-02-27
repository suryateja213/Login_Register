import { Injectable } from '@angular/core';
// import { AuthApi } from '../../../app/features/auth/data-access/auth.api';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'authToken';
  private authApiUrl = 'http://localhost:3000/v1/auth'; 
  private profileApiUrl = 'http://localhost:3000/v1/profile'; 
  private productApiUrl = 'http://localhost:3000/v1/products';
  constructor(private http: HttpClient) {}

  checkUsernameExists(username: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.authApiUrl}/check-username/${username}`);
  }

  login(data: { usernameOrEmail: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}/login`, data);
  }

  register(data: { first_name: string; username: string; email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.authApiUrl}/register`, data);
  }

  saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken(); 
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  uploadProfilePicture(data: FormData): Observable<any> {
    return this.http.post(`${this.profileApiUrl}/upload-profile-picture`, data, {
      headers: { Authorization: `Bearer ${this.getToken()}` }, // Include the token for authentication
    });
  }

  logout(): void {
    this.clearToken(); // Remove the token or relevant session data
  }

   // Method to fetch product details
   getProductDetails(page:number, size:number): Observable<any> {
    const params = new HttpParams()
    .set('page', page.toString())
    .set("size", size.toString())
    return this.http.get<any>(`${this.productApiUrl}`, {params}); // Make a GET request to fetch products
  }


  getUserData(): Observable<any> {
    const token = this.getToken();
    if (token) {
      // Fetch user data from the backend API
      return this.http.get<any>(`${this.authApiUrl}/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } else {
      // Return an empty observable if no token is available
      return new Observable((observer) => {
        observer.next({});
        observer.complete();
      });
    }
  }

  updateProductDetails(productId: number, updatedProductData: any): Observable<any> {
    // Use the full URL with productId to update the product details
    const url = `${this.productApiUrl}/updateProduct/${productId}`;
    
    return this.http.put(url, updatedProductData);
  }
  

// NEW: Method to delete a product by ID (no token required)
deleteProduct(productId: number): Observable<any> {
  return this.http.delete<any>(`${this.productApiUrl}/${productId}`);
}

// Updated: Method to download product details as PDF (no token required)
downloadProductAsPdf(product: any): void {
  const { jsPDF } = require('jspdf'); // Import jsPDF
  const doc = new jsPDF();
  
  // Extract product details
  const productName = product.product_name_and_image.name; // Name of the product
  const category = product.category; // Category of the product
  const price = product.unit; // Assuming "unit" is the price
  const quantity = product.quantity; // Quantity available
  const vendors = product.vendors.join(', '); // List of vendors
  const status = product.status === 1 ? 'Active' : 'Inactive'; // Status based on 1 or 0

  // Adding the details to the PDF
  doc.text(`Product Name: ${productName}`, 10, 10);
  doc.text(`Category: ${category}`, 10, 20);
  doc.text(`Price: ${price}`, 10, 30);
  doc.text(`Quantity: ${quantity}`, 10, 40);
  doc.text(`Vendors: ${vendors}`, 10, 50);
  doc.text(`Status: ${status}`, 10, 60);
  
  // Saving the PDF with the product name
  doc.save(`${productName}.pdf`);
}
}