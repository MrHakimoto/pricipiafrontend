import { ReactElement } from 'react';
import styles from './layout.module.css';
import { NavBar } from "@/components/NavBar/page";


type Props = {
    children: ReactElement;
}


export const Layoutt = ({ children }: Props) => {
    return (
    <>
    <NavBar />
    <header>
        <h1>Meu próprio projeto</h1>
    </header>
    <main>{children}</main>
    <footer>
        All rights reservate &copy
    </footer>
    </>
    );
}